import { Vpc } from 'aws-cdk-lib/aws-ec2';
import {
    Cluster,
    FargateService,
    FargateTaskDefinition,
} from 'aws-cdk-lib/aws-ecs';
import { DnsRecordType, NamespaceType } from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';
import { ServiceProps, Service } from './';

export interface ServicesProps {
    definition: FargateTaskDefinition;
    count?: number;
    name?: string;
}

export class Services extends Construct {
    constructor(scope: Construct, id: string, props: ServicesProps) {
        super(scope, id);

        for (let i = 0; i < (props.count || 1); i++) {
            new Service(this, `Service${i}`, {
                name: `${props.name}-${i}`,
                definition: props.definition,
            });
        }
    }
}
