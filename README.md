# mcp-ipinfo

MMDB (MaxMind DB) ファイルを読み込み、IP アドレスの地理情報やネットワーク情報を検索できる MCP サーバーです。

MaxMind GeoLite2 および IPinfo の MMDB ファイルに対応しています。

## セットアップ

```bash
npm install
npm run build
```

## 使い方

```bash
node build/index.js <path-to-mmdb> [additional-mmdb-paths...]
```

複数の MMDB ファイルを指定すると、検索結果がマージされます。

```bash
node build/index.js /path/to/GeoLite2-City.mmdb /path/to/GeoLite2-ASN.mmdb
```

## MCP クライアント設定

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

## ツール

### `lookup_ip`

単一の IP アドレスを検索します。

| パラメータ | 型 | 説明 |
|-----------|------|------|
| `ip` | string | IPv4 または IPv6 アドレス |

### `lookup_ips`

複数の IP アドレスを一括検索します（最大 100 件）。

| パラメータ | 型 | 説明 |
|-----------|------|------|
| `ips` | string[] | IPv4 または IPv6 アドレスの配列 |

### `get_database_info`

読み込み済みデータベースのメタデータを表示します。パラメータはありません。

## 対応データベース

- MaxMind GeoLite2 / GeoIP2 (City, Country, ASN)
- IPinfo (ipinfo_lite 等)
- その他の MMDB 形式（raw JSON として出力）

## ライセンス

MIT
