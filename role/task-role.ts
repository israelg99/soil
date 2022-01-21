import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Role, SubRoleProps } from './role';

export class TaskRole extends Role {
    constructor(scope: Construct, id: string, props: SubRoleProps) {
        super(scope, id, {
            ...props,
            principal: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managed: props.managed,
            prefix: 'task',
        });
    }
}
