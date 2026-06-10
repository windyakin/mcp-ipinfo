# mcp-ipinfo

An MCP server that reads MMDB (MaxMind DB) files and looks up geolocation and network information for IP addresses.

Supports MMDB files from MaxMind GeoLite2 and IPinfo.

## Setup

```bash
npm install
npm run build
```

## Usage

```bash
node build/index.js <path-to-mmdb> [additional-mmdb-paths...]
```

When multiple MMDB files are specified, lookup results are returned as a JSON
object keyed by the MMDB filename — results are **not** merged.

```bash
node build/index.js /path/to/GeoLite2-City.mmdb /path/to/GeoLite2-ASN.mmdb
```

If two paths share the same filename, the second one is keyed as
`<name>.mmdb#2` to avoid collisions.

## MCP Client Configuration

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "ipinfo": {
      "command": "node",
      "args": [
        "/path/to/mcp-ipinfo/build/index.js",
        "/path/to/your-database.mmdb"
      ]
    }
  }
}
```

## Tools

All tools return their result as a JSON-encoded text content. The raw maxmind
response is preserved under each entry's `data` field so clients can read
database-specific fields without losing information.

### `lookup_ip`

Look up a single IP address.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ip` | string | IPv4 or IPv6 address |

Returns an object keyed by MMDB filename. Each entry has `type` (one of
`city`, `country`, `asn`, `ipinfo`, `unknown`) and `data` (the raw maxmind
response, or `null` if the IP was not found in that database). Invalid IPs
return `{ "error": "..." }` and the tool result is flagged as an error.

```jsonc
{
  "GeoLite2-City.mmdb": {
    "type": "city",
    "data": { "country": { "iso_code": "US", "names": { "en": "United States" } }, "city": { "names": { "en": "Mountain View" } }, "location": { "latitude": 37.4, "longitude": -122.0 } }
  },
  "ipinfo_lite.mmdb": {
    "type": "ipinfo",
    "data": { "asn": "AS15169", "as_name": "Google LLC", "country": "United States", "country_code": "US" }
  },
  "GeoLite2-ASN.mmdb": {
    "type": "asn",
    "data": null
  }
}
```

### `lookup_ips`

Look up multiple IP addresses at once (up to 100).

| Parameter | Type | Description |
|-----------|------|-------------|
| `ips` | string[] | Array of IPv4 or IPv6 addresses |

Returns an object keyed by IP, each value following the `lookup_ip` shape
(including `{ "error": "..." }` for invalid inputs).

```jsonc
{
  "1.1.1.1":  { "ipinfo_lite.mmdb": { "type": "ipinfo", "data": { ... } } },
  "invalid":  { "error": "\"invalid\" is not a valid IPv4 or IPv6 address." },
  "9.9.9.9":  { "ipinfo_lite.mmdb": { "type": "ipinfo", "data": { ... } } }
}
```

### `get_database_info`

Show metadata for the loaded databases. Takes no parameters. Returns an object
keyed by MMDB filename.

```jsonc
{
  "ipinfo_lite.mmdb": {
    "type": "ipinfo",
    "path": "/path/to/ipinfo_lite.mmdb",
    "databaseType": "ipinfo bundle_location_lite.mmdb",
    "ipVersion": 6,
    "nodeCount": 3885389,
    "buildDate": "2026-06-07T08:04:19.000Z"
  }
}
```

## Supported Databases

- MaxMind GeoLite2 / GeoIP2 (City, Country, ASN)
- IPinfo (ipinfo_lite, etc.)
- Other MMDB formats (returned with `type: "unknown"` and the raw record under `data`)

## License

MIT
