import { Repository, IRepository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as ecrDeploy from 'cdk-ecr-deployment';
import { Construct } from 'constructs';

export interface EcrDeployProps {
    image: DockerImageAsset;
    repositoryName?: string;
}

export class EcrDeploy extends Construct {
    public readonly repo: IRepository;
    constructor(scope: Construct, id: string, props: EcrDeployProps) {
        super(scope, id);
        this.repo = new Repository(this, 'Repository', {
            repositoryName:
                props.repositoryName || this.node.tryGetContext('service'),
            removalPolicy: RemovalPolicy.DESTROY,
        });

        new ecrDeploy.ECRDeployment(this, 'EcrDeploy', {
            src: new ecrDeploy.DockerImageName(props.image.imageUri),
            dest: new ecrDeploy.DockerImageName(
                `${this.repo.repositoryUri}:latest`
            ),
        });
    }
}
