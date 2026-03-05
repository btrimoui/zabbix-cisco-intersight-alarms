# zabbix-cisco-intersight-alarms
Cisco Intersight REST API

Zabbix 7.x – Cisco Intersight Alarm Monitoring (cond/Alarms API)

This project provides a Zabbix 7.x integration for monitoring
Cisco Intersight alarms using the /api/v1/cond/Alarms REST API.
It creates one Zabbix problem per Intersight alarm, aligned with what operators see in the Intersight UI.

✅ What this integration does

Fetches alarms from Cisco Intersight
Uses OAuth2 client credentials
Discovers alarms dynamically using Low‑Level Discovery (LLD)
Creates one Zabbix problem per alarm
Automatically closes problems when alarms disappear
Filters out:
acknowledged alarms
suppressed alarms
cleared alarms
Supports optional HTTP proxy
Handles pagination safely (no alarm loss)

✅ Features

Zabbix 7.x compatible
OAuth2 authentication
Optional proxy support
Pagination with $skip
$inlinecount=allpages for validation
Clean alarm lifecycle
Minimal trigger logic (stable, no flapping)
Severity mapping (Critical / Warning / Info)
Documentation links via trigger URL or tags

✅ Requirements

Zabbix Server: 7.0 or newer
Cisco Intersight account
OAuth2 API credentials:
Client ID
Client Secret
Network access to Intersight (direct or via proxy)

 Intersight Permissions (RBAC)

This integration is read‑only and does not modify any resources in Cisco Intersight.


✅ A Read‑Only role in Intersight is fully sufficient for this integration.

Required permissions

Read access to: Alarms (cond/Alarms) & Related managed objects referenced by alarms

No write, acknowledge, or administrative privileges are required.


Recommended role
Use one of the standard Read‑Only roles provided by Cisco Intersight for the service account.

Official Cisco documentation
For details on roles and privileges, see:
🔗 https://intersight.com/help/saas/resources/RBAC#roles_and_privileges
For details on creating OAuth token, see: 
https://intersight.com/help/saas/settings#oauth_20_applications (you must be logged in with READ-ONLY account to generate a token with READ-ONLY access)

✅ How it works (high level)

Master script item

Authenticates via OAuth2

Fetches alarms from /api/v1/cond/Alarms

Applies API‑level filters

Handles pagination

Returns a single JSON payload

Low‑Level Discovery

Discovers alarms using alarm Moid

Creates one LLD object per alarm

Dependent items

Extract alarm‑specific fields (severity, description, affected object)

Trigger prototypes

Fire when the alarm exists

Close automatically when the alarm disappears

✅ API filters applied

Only alarms matching all of the following are included: 

Acknowledge = "None"

Suppressed = false

Severity != "Cleared"

This ensures Zabbix reflects active, actionable alarms only.

✅ Installation steps

1️⃣ Import the template

Import the YAML template from templates/

2️⃣ Create a host

Create a host (no agent required)

3️⃣ Assign the template

Link the Cisco Intersight template to the host

4️⃣ Configure macros

Set the following macros (template or host level):

Macro	Description

{$INTERSIGHT.API.BASE_URL}	Intersight API base URL (e.g. https://eu-central-1.intersight.com)

{$INTERSIGHT.OAUTH.CLIENT_ID}	OAuth2 client ID

{$INTERSIGHT.OAUTH.CLIENT_SECRET}	OAuth2 client secret

{$INTERSIGHT.OAUTH.TOKEN_URL}	OAuth2 token endpoint

{$INTERSIGHT.PROXY}	(Optional) Proxy URL or empty


✅ Leave {$INTERSIGHT.PROXY} empty if no proxy is required.



✅ Severity mapping

Intersight Severity	Zabbix Severity
Critical	High
Warning	Warning
Info	Information

Severity filtering is handled via trigger prototypes, not preprocessing.


✅ Problem lifecycle

Intersight state	Zabbix behavior

Alarm appears	Problem created

Alarm acknowledged	Not discovered → Alarm disappears from API → Problem closes

Alarm suppressed	Not discovered → Alarm disappears from API → Problem closes

Alarm cleared	Not discovered → Alarm disappears from API → Problem closes

No manual cleanup required.

⚠️ Important note about missing API data

If no data is returned from the Intersight API (for example due to:

API outage

network or proxy failure

authentication error

temporary Intersight service issue),

Then existing problems will NOT automatically close during that interval.


This is intentional and by design:

It prevents mass problem closure caused by transient API failures

It avoids false “recovery” events when monitoring data is unavailable

Once the API starts returning data again, the alarm lifecycle resumes normally.


✅ Known limitations

Acknowledgement is one‑way (Intersight → Zabbix)

Intersight UI acknowledgement may take a few minutes to propagate to the API

No bidirectional sync (by design)


✅ Tested with

Zabbix 7.0.x
Rocky Linux 9.x
Cisco Intersight (EU region)


✅ License

This project is licensed under the MIT License.
You are free to use, modify, and distribute it.
