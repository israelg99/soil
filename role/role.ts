import * as iam from 'aws-cdk-lib/aws-iam';
import { PolicyStatement } from 'cdk-iam-floyd';
import { Construct } from 'constructs';
import { capitalize } from '../util';
import { ServiceProps } from '../constructs';

export interface RoleProps {
    statements?: PolicyStatement[];
    principal: iam.ServicePrincipal;
    managed?: string[];
    policies?: iam.IManagedPolicy[];
    prefix?: string;
}

export interface SubRoleProps
    extends Omit<Omit<RoleProps, 'principal'>, 'prefix'> {}

export class Role extends Construct {
    public readonly role: iam.Role;
    constructor(scope: Construct, id: string, props: RoleProps) {
        super(scope, id);
        const service = this.node.tryGetContext('service');
        const policy = new iam.ManagedPolicy(this, `Policy`, {
            managedPolicyName: service,
            description: `Used by ${service} to access AWS resources`,
            statements: props.statements,
        });

        const policies: iam.IManagedPolicy[] = props.policies || [];
        props.managed?.map((policy) => {
            policies.push(iam.ManagedPolicy.fromAwsManagedPolicyName(policy));
        });

        let name = props.prefix ? `${props.prefix}-${service}` : service;
        name = capitalize(name);
        this.role = new iam.Role(this, `Role`, {
            roleName: name,
            description: `Used by ${service} to access AWS resources`,
            assumedBy: props.principal,
            managedPolicies: [policy, ...policies],
        });
    }
}
