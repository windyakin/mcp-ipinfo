.PHONY: build clean info

build: node_modules
	npm run build
	@$(MAKE) --no-print-directory info

node_modules: package.json package-lock.json
	npm ci
	@touch node_modules

clean:
	rm -rf build node_modules

info:
	@echo "MCP server command:"
	@echo "  node $(CURDIR)/build/index.js <path-to-mmdb>"
	@echo ""
	@echo "Claude Code:"
	@echo "  claude mcp add ipinfo node $(CURDIR)/build/index.js <path-to-mmdb>"
	@echo ""
	@echo "Claude Desktop (claude_desktop_config.json):"
	@echo '  {'
	@echo '    "mcpServers": {'
	@echo '      "ipinfo": {'
	@echo '        "command": "node",'
	@echo '        "args": ["$(CURDIR)/build/index.js", "<path-to-mmdb>"]'
	@echo '      }'
	@echo '    }'
	@echo '  }'
