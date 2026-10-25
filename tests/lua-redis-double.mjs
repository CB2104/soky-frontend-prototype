// Runs the production scripts in a Lua VM. Redis commands/clock are a local double.
import fengari from 'fengari';
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = fengari;
export const redisTestState = { values: new Map(), fail: false, calls: 0, offset: 0 };
const clock = () => Date.now() + redisTestState.offset;
function read(key) {
  const row = redisTestState.values.get(key);
  if (row && row.expiresAt !== null && row.expiresAt <= clock()) { redisTestState.values.delete(key); return null; }
  return row ?? null;
}
function push(L, value) {
  if (value === null || value === undefined) lua.lua_pushnil(L);
  else if (typeof value === 'number') lua.lua_pushnumber(L, value);
  else if (typeof value === 'boolean') lua.lua_pushboolean(L, value);
  else if (typeof value === 'string') lua.lua_pushstring(L, to_luastring(value));
  else {
    lua.lua_newtable(L);
    for (const [key, item] of Object.entries(value)) {
      push(L, item);
      if (Array.isArray(value)) lua.lua_rawseti(L, -2, Number(key) + 1);
      else lua.lua_setfield(L, -2, to_luastring(key));
    }
  }
}
function command(args) {
  const [name, key, value, ...options] = args;
  const row = read(key);
  switch (name.toUpperCase()) {
    case 'GET': return row?.value ?? null;
    case 'EXISTS': return row ? 1 : 0;
    case 'DEL': return redisTestState.values.delete(key) ? 1 : 0;
    case 'TTL': return row ? row.expiresAt === null ? -1 : Math.ceil((row.expiresAt - clock()) / 1000) : -2;
    case 'SET': {
      const expiresAt = options[0] === 'KEEPTTL' ? row?.expiresAt ?? null
        : options[0] === 'EX' ? clock() + Number(options[1]) * 1000 : null;
      redisTestState.values.set(key, { value, expiresAt }); return 'OK';
    }
    case 'INCR': {
      const result = Number(row?.value ?? 0) + 1;
      redisTestState.values.set(key, { value: String(result), expiresAt: row?.expiresAt ?? null }); return result;
    }
    case 'EXPIRE': {
      if (!row) return 0;
      row.expiresAt = clock() + Number(value) * 1000; return 1;
    }
    default: throw new Error(`Unsupported test Redis command: ${name}`);
  }
}
export class LuaRedis {
  check() { redisTestState.calls++; if (redisTestState.fail) throw new Error('Deliberate Redis outage; do not expose transport details'); }
  async get(key) { this.check(); return read(key)?.value ?? null; }
  async del(key) { this.check(); return redisTestState.values.delete(key) ? 1 : 0; }
  async eval(script, keys, args) {
    // Separate instances may overlap before EVAL; the script itself is indivisible.
    await new Promise(resolve => setImmediate(resolve));
    this.check();
    const L = lauxlib.luaL_newstate(); lualib.luaL_openlibs(L);
    push(L, keys); lua.lua_setglobal(L, to_luastring('KEYS'));
    push(L, args.map(String)); lua.lua_setglobal(L, to_luastring('ARGV'));
    lua.lua_newtable(L);
    lua.lua_pushcfunction(L, state => {
      const parts = Array.from({ length: lua.lua_gettop(state) }, (_, index) => to_jsstring(lua.lua_tolstring(state, index + 1)));
      push(state, command(parts)); return 1;
    });
    lua.lua_setfield(L, -2, to_luastring('call')); lua.lua_setglobal(L, to_luastring('redis'));
    lua.lua_newtable(L);
    lua.lua_pushcfunction(L, state => {
      try { push(state, JSON.parse(to_jsstring(lua.lua_tolstring(state, 1)))); return 1; }
      catch { return lauxlib.luaL_error(state, to_luastring('Invalid JSON')); }
    });
    lua.lua_setfield(L, -2, to_luastring('decode')); lua.lua_setglobal(L, to_luastring('cjson'));
    try {
      let status = lauxlib.luaL_loadstring(L, to_luastring(script));
      if (status === lua.LUA_OK) status = lua.lua_pcall(L, 0, 1, 0);
      if (status !== lua.LUA_OK) throw new Error(to_jsstring(lua.lua_tolstring(L, -1)));
      if (lua.lua_type(L, -1) === lua.LUA_TNUMBER) return lua.lua_tonumber(L, -1);
      if (lua.lua_type(L, -1) === lua.LUA_TSTRING) return to_jsstring(lua.lua_tolstring(L, -1));
      return null;
    } finally { lua.lua_close(L); }
  }
}
