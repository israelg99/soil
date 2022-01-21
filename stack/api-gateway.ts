import { CfnOutput, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { AssetApiDefinition, SpecRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Lambda } from '../constructs';
import { ServiceProps } from '../constructs';
import { capitalize } from '../util';

import fs = require('fs');
import yaml = require('yaml');

export interface ApiGatewayProps extends NestedStackProps {
    path: string;
    lambdas?: Lambda[];
}

export class ApiGateway extends NestedStack {
    public readonly path: string;
    public readonly endpoint: CfnOutput;

    constructor(scope: Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);
        this.path = props.path;

        let raw = yaml.stringify(
            yaml.parse(fs.readFileSync(this.path, 'utf8'))
        );
        props.lambdas?.map((lambda) => {
            raw = raw.replace(`\${${lambda.name}.Arn}`, lambda.arn);
        });
        const openapi = yaml.parse(raw);

        const openApiDef = AssetApiDefinition.fromInline(openapi);

        const service = this.node.tryGetContext('service');
        const api = new SpecRestApi(this, 'OpenApiSpec', {
            restApiName: capitalize(service),
            apiDefinition: openApiDef,
            deployOptions: {
                stageName: 'dev',
            },
        });

        this.endpoint = new CfnOutput(this, 'endpoint', {
            value: `https://${api.restApiId}.execute-api.us-east-1.amazonaws.com`,
            description: 'Execution URL',
            exportName: `${this.nestedStackParent!.stackName}-endpoint`,
        });
    }
}
