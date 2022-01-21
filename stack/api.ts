import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    ApiGateway,
    ApiGatewayProps,
    Lambdas,
    LambdasProps,
    StaticSite,
    StaticSiteProps,
} from './';

export interface ApiProps extends StackProps {
    lambdas: LambdasProps;
    gateway: ApiGatewayProps;
    docs: StaticSiteProps;
}

export class API extends Stack {
    constructor(scope: Construct, id: string, props: ApiProps) {
        super(scope, id);
        console.log(Stack.of(this).account);
        const lambdas = new Lambdas(this, 'lambdas', props.lambdas);

        const gateway = new ApiGateway(this, 'api-gateway', {
            ...props.gateway,
            lambdas: lambdas.lambdas,
        });
        gateway.addDependency(lambdas);

        new StaticSite(this, 'openapi', props.docs);
    }
}
