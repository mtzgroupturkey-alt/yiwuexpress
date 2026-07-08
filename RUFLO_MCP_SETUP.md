# Ruflo MCP Integration Setup

## ✅ What was done

Created MCP configuration file at:
```
.kiro/settings/mcp.json
```

This registers Ruflo as an MCP server in Kiro/Claude Code.

## 🚀 Next steps

### Option 1: Through Claude Code UI (Recommended)

1. Open **Claude Code** or **Kiro**
2. Look for **MCP** or **Settings** panel
3. You should see **"ruflo"** listed as an available server
4. Click to **enable/connect** it
5. The MCP server will start automatically

### Option 2: Manual CLI Setup

```bash
# Navigate to your project
cd c:\wamp64\www\yiwuexpress\ruflo

# Verify Ruflo MCP server is working
npx ruflo@latest mcp start

# In another terminal, test the tools
npx ruflo@latest mcp list
```

### Option 3: Check what tools are available

Once connected, all these tools become available in Claude Code:

#### 🧠 Memory Tools
- `ruflo__memory_store` - Save information to agent memory
- `ruflo__memory_search` - Search across agent experiences
- `ruflo__memory_clear` - Clear memory namespace

#### 🤖 Agent Tools
- `ruflo__agent_spawn` - Create a new specialized agent
- `ruflo__agent_kill` - Stop an agent
- `ruflo__swarm_init` - Initialize a multi-agent swarm

#### 🧩 Intelligence Tools
- `ruflo__router_route` - Route tasks to best agent
- `ruflo__pattern_learn` - Teach agents from past successes
- `ruflo__skill_invoke` - Run a trained skill

#### 🔧 Utility Tools
- `ruflo__plugin_list` - See all available plugins
- `ruflo__hook_register` - Set up auto-triggers
- `ruflo__federation_send` - Send work to remote agents

...and **190+ more tools** covering:
- Code review & testing
- Security audits
- Documentation generation
- Architecture decisions (ADR)
- Goal planning & decomposition
- Neural trading & market data
- DevOps & CI/CD
- Observability & monitoring

## 📋 Auto-Approved Tools

These tools won't ask for confirmation (auto-approved):
- `ruflo__memory_store`
- `ruflo__memory_search`
- `ruflo__agent_spawn`
- `ruflo__swarm_init`
- `ruflo__router_route`

## 🔗 Configuration Location

**Workspace level:** `.kiro/settings/mcp.json`
(Precedence: user level < workspace level)

If you want to add it at user level (~/.kiro/settings/mcp.json):
```json
{
  "mcpServers": {
    "ruflo": {
      "command": "npx",
      "args": ["ruflo@latest", "mcp", "start"],
      "env": {
        "NODE_NO_WARNINGS": "1",
        "RUFLO_LOG_LEVEL": "info"
      },
      "disabled": false,
      "autoApprove": [
        "ruflo__memory_store",
        "ruflo__memory_search",
        "ruflo__agent_spawn",
        "ruflo__swarm_init",
        "ruflo__router_route"
      ]
    }
  }
}
```

## ✨ Once Connected

You can now:

1. **Ask Claude Code to use agents**: "Use the security architect agent to audit this code"
2. **Store & retrieve memories**: "Remember this pattern for future use"
3. **Spawn specialized workers**: "Create a test-generation agent for this module"
4. **Coordinate swarms**: "Initialize a 5-agent swarm for this refactor"
5. **Learn from successes**: SONA neural patterns auto-capture winning strategies

## 🆘 Troubleshooting

### MCP Server won't start
```bash
# Check if Ruflo is installed correctly
npx ruflo@latest --version

# Try starting the MCP server directly
npx ruflo@latest mcp start

# Check for port conflicts (default: 3000)
netstat -ano | findstr :3000
```

### Tools not showing up
1. Restart Claude Code/Kiro
2. Check `.kiro/settings/mcp.json` is valid JSON
3. Look at MCP Server logs in the IDE output panel
4. Verify `node` and `npm` are in PATH: `node --version`, `npm --version`

### Connection issues
```bash
# Test MCP server health
curl http://localhost:3000/health

# Check Ruflo logs
npx ruflo@latest status
```

## 📚 Learn More

- **Full agent list**: `c:\wamp64\www\yiwuexpress\ruflo\AGENTS.md`
- **User guide**: `c:\wamp64\www\yiwuexpress\ruflo\docs\USERGUIDE.md`
- **MCP tools reference**: `c:\wamp64\www\yiwuexpress\ruflo\docs\MCP-TOOLS.md`
- **Architecture**: `c:\wamp64\www\yiwuexpress\ruflo\docs\architecture.md`

## 🎯 Next: Full Ruflo Setup (Optional)

Ready for the complete experience? Run:
```bash
cd c:\wamp64\www\yiwuexpress\ruflo
npx ruflo@latest init wizard
```

This adds:
- 98+ agents in your project
- 60+ CLI commands
- 30 skills
- Auto-learning system
- Background workers
- Federation (cross-machine agent collaboration)

---

**Status**: ✅ MCP configured and ready to connect
**Next step**: Restart Claude Code or Kiro to see Ruflo tools available
