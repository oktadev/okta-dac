# Proxy API calls to Okta
okta-dac includes REST APIs that were implemented using the concepts described [here](https://docs.idp.rocks/guide/api-design.html). To deploy the API, follow the steps below.

## Prerequisites
* Install [Serverless](https://www.serverless.com/framework/docs/getting-started/)
    e.g. via npm:
    ```
    npm install -g serverless
    ```

## Serverless
Use the provided Makefile to deploy the api with serverless. From the `/okta-dac` (root) folder (that contains the Makefile), run
```
make api
```
Stop here. You are done deploying the API.

---

## Optional
If you prefer not to use the Makefile, follow these steps:

1. `cd` into the `dac-api` folder, then
2. Copy the file `.env.json.template` into `.env.json` (note there should be a leading `.`) and edit it with corresponding values from `/terraform/terraform.tfvars`:
    ```js
    {
        "AWS_PROFILE": "<aws_profile>",
        "AWS_REGION": "<aws_region>",
        "ENVIRONMENT": "<environment>",
        "AWS_SSM_PREFIX": "<aws_ssm_prefix>"
    }
    ```
3. Populate AWS SSM parameters:
    * IF YOU DID RUN Terraform, SKIP THIS STEP.
    * If you did NOT not run Terraform, add the ssm parameters manually: From AWS console, navigate to **Systems Manager > Parameter Store**. Add the following parameters in your desired region:

    | parameter             | type         | value |
    | --------------------- | ------------ | ----- |
    | api-token             | SecureString | Follow [these steps](https://docs.idp.rocks/setup/#enable-programmatic-access-to-okta) to obtain an api token |
    | client-id             | String       | The client_id of the Okta App. In Okta, search for the app named `okta-dac` and copy-paste its *client_id* value |
    | issuer_uri            | String       | The `issuer_uri` of the Auth Server. In Okta, search for the Authorization Server named `okta-dac` and copy-paste its *Issuer URI* value |
    | audience              | String       | The `audience` of the Auth Server. In Okta, search for the Authorization Server named `okta-dac` and copy-paste its *Audience* value | 
    | dns-verify-prefix     | String       | `_oktadac.verification` | 
    | dac-prefix            | String       | `DAC` |
    | okta-idp-disco-policyId | String     | Run `GET https://${your-okta-org-url}/api/v1/policies?type=IDP_DISCOVERY` to get the `id` returned in the first (and only) object of the array |
    | dummy-cert            | String       | A DER or PEM encoded public key cert (preferrably expiring far in the future). Okta requires [idps](https://developer.okta.com/docs/reference/api/idps/) to be created witha cert object and okta-dac requires a dummy value when creating "placeholder" idps |

    ---

    Terraform adds parameters in the AWS Systems Manager Parameter Store that are referenced in `serverless.yml`. So if you did not run Terraform, edit your `serverless.yml`:
    ```yml
    provider:
        name: aws
        runtime: nodejs12.x
        profile: ${self:custom.env.AWS_PROFILE} # <-- edit this
        region: ${self:custom.env.AWS_REGION}   # <-- edit this
        stage: ${self:custom.env.ENVIRONMENT}   # <-- edit this
        environment:
            ISSUER: ${ssm:/${self:custom.ssmPrefix}/okta/${self:provider.stage}/issuer-uri}      # <-- edit this
            AUDIENCE: ${ssm:/${self:custom.ssmPrefix}/okta/${self:provider.stage}/audience}      # <-- edit this
            CLIENT_ID: ${ssm:/${self:custom.ssmPrefix}/okta/${self:provider.stage}/client-id}    # <-- edit this
            OKTA_API_KEY: ${ssm:/${self:custom.ssmPrefix}/okta/${self:provider.stage}/api-token~true} # <-- edit this

            TEMPLATE_CERT: ${ssm:/${self:custom.ssmPrefix}/okta/${self:provider.stage}/dummy-cert}  # <-- edit this
            IDP_DISCO_POLICY_ID: ${ssm:/${self:custom.ssmPrefix}/okta/${self:provider.stage}/okta-idp-disco-policyId} # <-- edit this
            DNS_VERIFY_PREFIX: ${ssm:/${self:custom.ssmPrefix}/okta/${self:provider.stage}/dns-verify-prefix} # <-- edit this
            RESERVED_PREFIX: ${ssm:/${self:custom.ssmPrefix}/okta/${self:provider.stage}/dac-prefix} # <-- edit this
    ```

4. Run the serverless deploy command
    ```
    sls deploy
    ```
