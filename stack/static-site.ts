#!/usr/bin/env node
import {
    Aws,
    CfnOutput,
    NestedStack,
    NestedStackProps,
    RemovalPolicy,
} from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface StaticSiteProps extends NestedStackProps {
    domain?: string;
    subDomain?: string;
    bucket?: string;
    dir: string;
}

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */
export class StaticSite extends NestedStack {
    constructor(parent: Construct, name: string, props: StaticSiteProps) {
        super(parent, name);

        // Raise exception if all props are not provided.
        if (!props.bucket && (!props.domain || !props.subDomain)) {
            throw new Error(
                'StaticSite requires at least a bucket name OR (domainName & siteSubDomain)'
            );
        }

        const siteDomain = props.domain
            ? props.subDomain + '.' + props.domain
            : null;
        const bucket = props.bucket ? props.bucket : siteDomain!;

        const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
            this,
            'cloudfront-OAI',
            {
                comment: `OAI for ${name}`,
            }
        );

        // Content bucket
        const siteBucket = new s3.Bucket(this, 'SiteBucket', {
            bucketName: bucket,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

            /**
             * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
             * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
             * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
             */
            removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code

            /**
             * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
             * setting will enable full cleanup of the demo.
             */
            autoDeleteObjects: true, // NOT recommended for production code
        });
        // Grant access to cloudfront
        siteBucket.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ['s3:GetObject'],
                resources: [siteBucket.arnForObjects('*')],
                principals: [
                    new iam.CanonicalUserPrincipal(
                        cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
                    ),
                ],
            })
        );
        new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

        let viewerCertificate = undefined;
        let zone = undefined;
        if (siteDomain) {
            zone = route53.HostedZone.fromLookup(this, 'Zone', {
                domainName: props.domain!,
            });

            // TLS certificate
            const certificate = new acm.DnsValidatedCertificate(
                this,
                'SiteCertificate',
                {
                    domainName: siteDomain,
                    hostedZone: zone,
                    region: 'us-east-1', // Cloudfront only checks this region for certificates.
                }
            );
            const certificateArn = certificate.certificateArn;
            new CfnOutput(this, 'Certificate', { value: certificateArn });

            // Specifies you want viewers to use HTTPS & TLS v1.1 to request your objects
            viewerCertificate = cloudfront.ViewerCertificate.fromAcmCertificate(
                {
                    certificateArn: certificateArn,
                    env: {
                        region: Aws.REGION,
                        account: Aws.ACCOUNT_ID,
                    },
                    node: this.node,
                    stack: this,
                    metricDaysToExpiry: () =>
                        new cloudwatch.Metric({
                            namespace: 'TLS Viewer Certificate Validity',
                            metricName: 'TLS Viewer Certificate Expired',
                        }),
                    applyRemovalPolicy: certificate.applyRemovalPolicy,
                },
                {
                    sslMethod: cloudfront.SSLMethod.SNI,
                    securityPolicy:
                        cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
                    aliases: [siteDomain],
                }
            );
            new CfnOutput(this, 'Site', { value: 'https://' + siteDomain });
        }

        // CloudFront distribution
        const distribution = new cloudfront.CloudFrontWebDistribution(
            this,
            'SiteDistribution',
            {
                viewerCertificate,
                originConfigs: [
                    {
                        s3OriginSource: {
                            s3BucketSource: siteBucket,
                            originAccessIdentity: cloudfrontOAI,
                        },
                        behaviors: [
                            {
                                isDefaultBehavior: true,
                                compress: true,
                                allowedMethods:
                                    cloudfront.CloudFrontAllowedMethods
                                        .GET_HEAD_OPTIONS,
                            },
                        ],
                    },
                ],
            }
        );
        new CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId,
        });
        new CfnOutput(this, 'DistributionDomainName', {
            value: distribution.distributionDomainName,
        });

        if (siteDomain) {
            // Route53 alias record for the CloudFront distribution
            zone = zone!;
            new route53.ARecord(this, 'SiteAliasRecord', {
                recordName: siteDomain,
                target: route53.RecordTarget.fromAlias(
                    new targets.CloudFrontTarget(distribution)
                ),
                zone,
            });
        }

        // Deploy site contents to S3 bucket
        new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
            sources: [s3deploy.Source.asset(props.dir)],
            destinationBucket: siteBucket,
            distribution,
            distributionPaths: ['/*'],
        });
    }
}
