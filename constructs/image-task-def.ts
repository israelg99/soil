import { Arn, Stack } from 'aws-cdk-lib';
import {
    ContainerDefinitionOptions,
    ContainerImage,
    FargateTaskDefinition,
    FargateTaskDefinitionProps,
    LogDriver,
} from 'aws-cdk-lib/aws-ecs';
import { IRole, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ImageDeploy } from '../constructs';

export interface ImageTaskDefinitionProps
    extends Omit<ContainerDefinitionOptions, 'image'> {
    task?: FargateTaskDefinitionProps;
    role?: IRole;
    roleName?: string;
}

export class ImageTaskDefinition extends Construct {
    public readonly definition: FargateTaskDefinition;
    constructor(
        scope: Construct,
        id: string,
        props?: ImageTaskDefinitionProps
    ) {
        super(scope, id);

        let taskRole = undefined;
        if (props?.roleName) {
            console.log(
                Arn.format(
                    {
                        service: 'iam',
                        resource: 'role',
                        partition: 'aws',
                        region: '',
                        resourceName: props.roleName,
                    },
                    Stack.of(this)
                )
            );
            taskRole = Role.fromRoleArn(
                this,
                'Role',
                Arn.format(
                    {
                        service: 'iam',
                        resource: 'role',
                        partition: 'aws',
                        region: '',
                        resourceName: props.roleName,
                    },
                    Stack.of(this)
                )
            );
        }

        const image = new ImageDeploy(this, 'ImageDeploy');
        const name =
            props?.containerName ||
            this.node.tryGetContext('service') ||
            image.ecr.repo.repositoryName;
        this.definition = new FargateTaskDefinition(this, 'TaskDef', {
            family: name,
            taskRole: props?.role || taskRole,
            ...props?.task,
        });

        this.definition.addContainer('Container', {
            image: ContainerImage.fromEcrRepository(image.ecr.repo),
            containerName: name,
            logging: LogDriver.awsLogs({
                streamPrefix: name,
            }),
            ...props,
        });
    }
}
