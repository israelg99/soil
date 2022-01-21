import {
    PythonFunction,
    PythonFunctionProps,
} from '@aws-cdk/aws-lambda-python-alpha';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { setID } from '../util';
import * as policy from 'cdk-iam-floyd';
import * as iam from 'aws-cdk-lib/aws-iam';
import { ServiceProps } from './';

export interface LambdaProps extends PythonFunctionProps {
    account: string;
    statements?: policy.PolicyStatement[];
    role?: iam.Role;
}

export class Lambda extends Construct {
    public readonly arn: string;
    public readonly name: string;
    constructor(scope: Construct, id: string, props: LambdaProps) {
        super(scope, id);
        this.name = props.functionName!;
        const statements = props.statements || [];

        const principal = new ServicePrincipal('apigateway.amazonaws.com');

        const func = new PythonFunction(this, this.name, {
            ...props,
        });
        setID(func, this.name);
        this.arn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:${props.account}:function:${this.name}/invocations`;

        func.grantInvoke(principal);

        statements.map((statement) => {
            func.addToRolePolicy(statement);
        });
    }
}
