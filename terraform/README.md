# Terraform
This application is represented by an OpenID Connect application in Okta, so we need to configure one. We'll use the [Okta Terraform Provider](https://www.terraform.io/docs/providers/okta/index.html) to automate this process.

## Prerequisites
* Install [terraform](https://learn.hashicorp.com/terraform/getting-started/install)

### Manual Setup
**(Optional) If you're more confortable manually configuring Okta,** refer to the manual steps [here](https://docs.idp.rocks/setup/org-setup.html#manual-config). Otherwise follow instructions [below](#okta-setup).

### Okta Setup

* Using the provided Makefile:

    `cd` to the `/okta-dac` (root) folder (that contains the Makefile) and run:
    ```
    make okta
    ```

* **(Optional)** Or, if you prefer not to use the Makefile, follow these steps.
    1. `cd` into the `/terraform` folder
    2. Setup the `tfvars` file per [these](https://github.com/oktadeveloper/okta-dac#environment-variables) instructions, then run
    3. `terraform init && terraform plan -out=okta.setup.tfplan -lock=false`
    4. `terraform apply -auto-approve okta.setup.tfplan`

#### (Required) Manual Step
Terraform currently does not support granting Okta API Scopes. These are required for okta-dac to properly function.

![oauth scopes](../images/okta-api-scopes.png)
1. Login to your Org's Admin Console. Search for the `okta-dac` app
2. Navigate to the **Okta API Scopes** tab and Grant the following scopes:
    * `okta.groups.manage`
    * `okta.users.manage`
