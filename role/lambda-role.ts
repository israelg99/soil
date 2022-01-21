import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Role, SubRoleProps } from './role';

export class LambdaRole extends Role {
    constructor(scope: Construct, id: string, props: SubRoleProps) {
        const managed = props.managed || [];
        super(scope, id, {
            ...props,
            principal: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managed: managed.concat(
                'service-role/AWSLambdaBasicExecutionRole',
                'service-role/AWSLambdaVPCAccessExecutionRole'
            ),
            prefix: 'lambda',
        });
    }
}
