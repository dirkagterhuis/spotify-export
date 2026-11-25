# Organization policies (B.1e, B.1g)

Service control policies (SCPs) for the AWS Organization. They are applied by hand from the management account (SCPs never apply to that account itself), and this folder is the reviewed source of truth: change the JSON here first, then paste it into the console.

## `guardrail-scp.json`

Attached to the member account `spotify-export` only. `FullAWSAccess` stays attached: every statement here is a `Deny`, so it works no matter what else is attached above the account.

| Statement | What it does |
| --- | --- |
| `DenyAllRegionsExceptFrankfurt` | Every call outside `eu-central-1` is denied, except for global services (IAM, STS, Budgets) and the few S3 calls that always go to `us-east-1`. |
| `DenyEveryServiceNotOnTheAllowList` | Every service not on the list is denied, EC2, SageMaker and Bedrock included, even for an admin. CloudTrail is read-only (the free event history). |
| `DenyLongLivedCredentials` | No IAM users, access keys or console passwords. People use Identity Center, CI uses OIDC. |
| `DenyLeavingTheOrganization` | A compromised admin can't take the account out of the organization to escape these rules. |

Adding a service later: change the allow-list here, get it reviewed, then update the policy in the console. A deploy that fails with `explicit deny in a service control policy` means the list is missing something.

The SCP size limit is 5,120 characters. The policy is about 900 characters minified, so there is plenty of room.

### Applying it

From the management account (root until B.1f, then your Identity Center user):

1. Organizations → Policies → Service control policies → Create policy. Name `spotify-export-guardrail`, paste the JSON, create.
2. Open the policy → Targets → Attach → the `spotify-export` account (not the root, not an OU).
3. Check: AWS accounts → `spotify-export` → Policies shows both `FullAWSAccess` and `spotify-export-guardrail`.
