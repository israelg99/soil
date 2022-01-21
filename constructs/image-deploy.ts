import { Construct } from 'constructs';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';
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
            directory: path.join(__dirname, `../${props?.path || ''}`),
        });

        this.ecr = new EcrDeploy(this, 'EcrDeploy', {
            image,
            repositoryName: props?.repositoryName,
        });
    }
}
