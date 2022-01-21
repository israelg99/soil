import { Stack, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Lambda } from '../constructs';
import { LambdaRole, SubRoleProps } from '../role';
import { capitalize } from '../util';
import { ServiceProps } from '../constructs';

export interface LambdaDefaultProps {}

export interface LambdasProps extends NestedStackProps {
    names: string[];
    runtime: Runtime;
    dir: string;
    account: string;
    environment?: { [key: string]: string };
    policy?: SubRoleProps;
}

export class Lambdas extends NestedStack {
    public readonly lambdas: Lambda[] = [];
    constructor(scope: Construct, id: string, props: LambdasProps) {
        super(scope, id);
        console.log(Stack.of(this).account);
        const role = props.policy
            ? new LambdaRole(this, `Role`, {
                  ...props.policy,
              }).role
            : undefined;

        const service = this.node.tryGetContext('service');
        props.names.map((name) => {
            const functionName = capitalize(`${service}-${name}`);
            this.lambdas.push(
                new Lambda(this, functionName, {
                    functionName,
                    index: `${name}.py`,
                    entry: props.dir,
                    role,
                    ...props,
                })
            );
        });
    }
}
