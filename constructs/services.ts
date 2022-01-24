import { FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { Service } from './';

export interface ServicesProps {
    definition: FargateTaskDefinition;
    count?: number;
    name?: string;
}

export class Services extends Construct {
    constructor(scope: Construct, id: string, props: ServicesProps) {
        super(scope, id);

        const name = props.name || this.node.tryGetContext('service');

        for (let i = 0; i < (props.count || 1); i++) {
            new Service(this, `Service${i}`, {
                name: `${name}-${i}`,
                definition: props.definition,
            });
        }
    }
}
