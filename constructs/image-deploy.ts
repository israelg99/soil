import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import { EcrDeploy } from './';

export interface ImageDeployProps {
    path?: string;
    repositoryName?: string;
}

export class ImageDeploy extends Construct {
    public readonly ecr: EcrDeploy;
    constructor(scope: Construct, id: string, props?: ImageDeployProps) {
        super(scope, id);
        const image = new DockerImageAsset(this, 'Image', {
            directory: props?.path || '',
        });

        this.ecr = new EcrDeploy(this, 'EcrDeploy', {
            image,
            repositoryName: props?.repositoryName,
        });
    }
}
