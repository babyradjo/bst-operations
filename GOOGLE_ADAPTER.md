# Google production adapter

The V1 interface remains in local demo mode unless a server-side Google credential flow is configured.

The adapter is reserved for the existing BST Control Center spreadsheet and Drive root. It does not assert access or establish a connection. Before activation, configure server-only OAuth or service-account credentials, grant least-privilege access, map the listed modules to validated schema fields, and confirm error/audit handling. No secret is stored in this repository.
