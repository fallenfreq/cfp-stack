// .wrangler/tmp/bundle-emdUqg/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-A98Hmq/functionsWorker-0.7541878249220604.mjs
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all3) => {
  for (var name in all3)
    __defProp(target, name, { get: all3[name], enumerable: true });
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
var urls2;
var init_checked_fetch = __esm({
  "../.wrangler/tmp/bundle-wegpQd/checked-fetch.js"() {
    urls2 = /* @__PURE__ */ new Set();
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL2(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = value.constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
var entityKind;
var hasOwnEntityKind;
var init_entity = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/entity.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    entityKind = Symbol.for("drizzle:entityKind");
    hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
  }
});
var _a;
var ConsoleLogWriter;
var _a2;
var DefaultLogger;
var _a3;
var NoopLogger;
var init_logger = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/logger.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    ConsoleLogWriter = class {
      write(message) {
        console.log(message);
      }
    };
    _a = entityKind;
    __publicField(ConsoleLogWriter, _a, "ConsoleLogWriter");
    DefaultLogger = class {
      writer;
      constructor(config) {
        this.writer = config?.writer ?? new ConsoleLogWriter();
      }
      logQuery(query, params) {
        const stringifiedParams = params.map((p) => {
          try {
            return JSON.stringify(p);
          } catch {
            return String(p);
          }
        });
        const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
        this.writer.write(`Query: ${query}${paramsStr}`);
      }
    };
    _a2 = entityKind;
    __publicField(DefaultLogger, _a2, "DefaultLogger");
    NoopLogger = class {
      logQuery() {
      }
    };
    _a3 = entityKind;
    __publicField(NoopLogger, _a3, "NoopLogger");
  }
});
function isTable(table) {
  return typeof table === "object" && table !== null && IsDrizzleTable in table;
}
function getTableName(table) {
  return table[TableName];
}
var TableName;
var Schema;
var Columns;
var OriginalName;
var BaseName;
var IsAlias;
var ExtraConfigBuilder;
var IsDrizzleTable;
var _a4;
var Table;
var init_table = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/table.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    TableName = Symbol.for("drizzle:Name");
    Schema = Symbol.for("drizzle:Schema");
    Columns = Symbol.for("drizzle:Columns");
    OriginalName = Symbol.for("drizzle:OriginalName");
    BaseName = Symbol.for("drizzle:BaseName");
    IsAlias = Symbol.for("drizzle:IsAlias");
    ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
    IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
    Table = class {
      /**
       * @internal
       * Can be changed if the table is aliased.
       */
      [(_a4 = entityKind, TableName)];
      /**
       * @internal
       * Used to store the original name of the table, before any aliasing.
       */
      [OriginalName];
      /** @internal */
      [Schema];
      /** @internal */
      [Columns];
      /**
       *  @internal
       * Used to store the table name before the transformation via the `tableCreator` functions.
       */
      [BaseName];
      /** @internal */
      [IsAlias] = false;
      /** @internal */
      [ExtraConfigBuilder] = void 0;
      [IsDrizzleTable] = true;
      constructor(name, schema, baseName) {
        this[TableName] = this[OriginalName] = name;
        this[Schema] = schema;
        this[BaseName] = baseName;
      }
    };
    __publicField(Table, _a4, "Table");
    __publicField(Table, "Symbol", {
      Name: TableName,
      Schema,
      OriginalName,
      Columns,
      BaseName,
      IsAlias,
      ExtraConfigBuilder
    });
  }
});
var _a5;
var Column;
var init_column = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/column.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    Column = class {
      constructor(table, config) {
        this.table = table;
        this.config = config;
        this.name = config.name;
        this.notNull = config.notNull;
        this.default = config.default;
        this.defaultFn = config.defaultFn;
        this.onUpdateFn = config.onUpdateFn;
        this.hasDefault = config.hasDefault;
        this.primary = config.primaryKey;
        this.isUnique = config.isUnique;
        this.uniqueName = config.uniqueName;
        this.uniqueType = config.uniqueType;
        this.dataType = config.dataType;
        this.columnType = config.columnType;
      }
      name;
      primary;
      notNull;
      default;
      defaultFn;
      onUpdateFn;
      hasDefault;
      isUnique;
      uniqueName;
      uniqueType;
      dataType;
      columnType;
      enumValues = void 0;
      config;
      mapFromDriverValue(value) {
        return value;
      }
      mapToDriverValue(value) {
        return value;
      }
    };
    _a5 = entityKind;
    __publicField(Column, _a5, "Column");
  }
});
var InlineForeignKeys;
var _a6;
var PgTable;
var init_table2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/pg-core/table.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_table();
    InlineForeignKeys = Symbol.for("drizzle:PgInlineForeignKeys");
    PgTable = class extends Table {
      /**@internal */
      [(_a6 = entityKind, InlineForeignKeys)] = [];
      /** @internal */
      [Table.Symbol.ExtraConfigBuilder] = void 0;
    };
    __publicField(PgTable, _a6, "PgTable");
    __publicField(PgTable, "Symbol", Object.assign({}, Table.Symbol, {
      InlineForeignKeys
    }));
  }
});
var _a7;
var PrimaryKeyBuilder;
var _a8;
var PrimaryKey;
var init_primary_keys = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/pg-core/primary-keys.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_table2();
    PrimaryKeyBuilder = class {
      /** @internal */
      columns;
      /** @internal */
      name;
      constructor(columns, name) {
        this.columns = columns;
        this.name = name;
      }
      /** @internal */
      build(table) {
        return new PrimaryKey(table, this.columns, this.name);
      }
    };
    _a7 = entityKind;
    __publicField(PrimaryKeyBuilder, _a7, "PgPrimaryKeyBuilder");
    PrimaryKey = class {
      constructor(table, columns, name) {
        this.table = table;
        this.columns = columns;
        this.name = name;
      }
      columns;
      name;
      getName() {
        return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
      }
    };
    _a8 = entityKind;
    __publicField(PrimaryKey, _a8, "PgPrimaryKey");
  }
});
var _a9;
var ColumnBuilder;
var init_column_builder = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/column-builder.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    ColumnBuilder = class {
      config;
      constructor(name, dataType, columnType) {
        this.config = {
          name,
          notNull: false,
          default: void 0,
          hasDefault: false,
          primaryKey: false,
          isUnique: false,
          uniqueName: void 0,
          uniqueType: void 0,
          dataType,
          columnType
        };
      }
      /**
       * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
       *
       * @example
       * ```ts
       * const users = pgTable('users', {
       * 	id: integer('id').$type<UserId>().primaryKey(),
       * 	details: json('details').$type<UserDetails>().notNull(),
       * });
       * ```
       */
      $type() {
        return this;
      }
      /**
       * Adds a `not null` clause to the column definition.
       *
       * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
       */
      notNull() {
        this.config.notNull = true;
        return this;
      }
      /**
       * Adds a `default <value>` clause to the column definition.
       *
       * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
       *
       * If you need to set a dynamic default value, use {@link $defaultFn} instead.
       */
      default(value) {
        this.config.default = value;
        this.config.hasDefault = true;
        return this;
      }
      /**
       * Adds a dynamic default value to the column.
       * The function will be called when the row is inserted, and the returned value will be used as the column value.
       *
       * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
       */
      $defaultFn(fn) {
        this.config.defaultFn = fn;
        this.config.hasDefault = true;
        return this;
      }
      /**
       * Alias for {@link $defaultFn}.
       */
      $default = this.$defaultFn;
      /**
       * Adds a dynamic update value to the column.
       * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
       * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
       *
       * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
       */
      $onUpdateFn(fn) {
        this.config.onUpdateFn = fn;
        this.config.hasDefault = true;
        return this;
      }
      /**
       * Alias for {@link $onUpdateFn}.
       */
      $onUpdate = this.$onUpdateFn;
      /**
       * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
       *
       * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
       */
      primaryKey() {
        this.config.primaryKey = true;
        this.config.notNull = true;
        return this;
      }
    };
    _a9 = entityKind;
    __publicField(ColumnBuilder, _a9, "ColumnBuilder");
  }
});
var _a10;
var ForeignKeyBuilder;
var _a11;
var ForeignKey;
var init_foreign_keys = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/pg-core/foreign-keys.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_table2();
    ForeignKeyBuilder = class {
      /** @internal */
      reference;
      /** @internal */
      _onUpdate = "no action";
      /** @internal */
      _onDelete = "no action";
      constructor(config, actions) {
        this.reference = () => {
          const { name, columns, foreignColumns } = config();
          return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
        };
        if (actions) {
          this._onUpdate = actions.onUpdate;
          this._onDelete = actions.onDelete;
        }
      }
      onUpdate(action) {
        this._onUpdate = action === void 0 ? "no action" : action;
        return this;
      }
      onDelete(action) {
        this._onDelete = action === void 0 ? "no action" : action;
        return this;
      }
      /** @internal */
      build(table) {
        return new ForeignKey(table, this);
      }
    };
    _a10 = entityKind;
    __publicField(ForeignKeyBuilder, _a10, "PgForeignKeyBuilder");
    ForeignKey = class {
      constructor(table, builder) {
        this.table = table;
        this.reference = builder.reference;
        this.onUpdate = builder._onUpdate;
        this.onDelete = builder._onDelete;
      }
      reference;
      onUpdate;
      onDelete;
      getName() {
        const { name, columns, foreignColumns } = this.reference();
        const columnNames = columns.map((column) => column.name);
        const foreignColumnNames = foreignColumns.map((column) => column.name);
        const chunks = [
          this.table[PgTable.Symbol.Name],
          ...columnNames,
          foreignColumns[0].table[PgTable.Symbol.Name],
          ...foreignColumnNames
        ];
        return name ?? `${chunks.join("_")}_fk`;
      }
    };
    _a11 = entityKind;
    __publicField(ForeignKey, _a11, "PgForeignKey");
  }
});
function iife(fn, ...args) {
  return fn(...args);
}
var init_tracing_utils = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/tracing-utils.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
function uniqueKeyName(table, columns) {
  return `${table[PgTable.Symbol.Name]}_${columns.join("_")}_unique`;
}
var _a12;
var UniqueConstraintBuilder;
var _a13;
var UniqueOnConstraintBuilder;
var _a14;
var UniqueConstraint;
var init_unique_constraint = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/pg-core/unique-constraint.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_table2();
    UniqueConstraintBuilder = class {
      constructor(columns, name) {
        this.name = name;
        this.columns = columns;
      }
      /** @internal */
      columns;
      /** @internal */
      nullsNotDistinctConfig = false;
      nullsNotDistinct() {
        this.nullsNotDistinctConfig = true;
        return this;
      }
      /** @internal */
      build(table) {
        return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
      }
    };
    _a12 = entityKind;
    __publicField(UniqueConstraintBuilder, _a12, "PgUniqueConstraintBuilder");
    UniqueOnConstraintBuilder = class {
      /** @internal */
      name;
      constructor(name) {
        this.name = name;
      }
      on(...columns) {
        return new UniqueConstraintBuilder(columns, this.name);
      }
    };
    _a13 = entityKind;
    __publicField(UniqueOnConstraintBuilder, _a13, "PgUniqueOnConstraintBuilder");
    UniqueConstraint = class {
      constructor(table, columns, nullsNotDistinct, name) {
        this.table = table;
        this.columns = columns;
        this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
        this.nullsNotDistinct = nullsNotDistinct;
      }
      columns;
      name;
      nullsNotDistinct = false;
      getName() {
        return this.name;
      }
    };
    _a14 = entityKind;
    __publicField(UniqueConstraint, _a14, "PgUniqueConstraint");
  }
});
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}
var init_array = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/pg-core/utils/array.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
var _a15;
var PgColumnBuilder;
var _a16;
var PgColumn;
var _a17;
var PgArrayBuilder;
var _a18;
var _PgArray;
var PgArray;
var init_common = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/pg-core/columns/common.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_column_builder();
    init_column();
    init_entity();
    init_foreign_keys();
    init_tracing_utils();
    init_unique_constraint();
    init_array();
    PgColumnBuilder = class extends ColumnBuilder {
      foreignKeyConfigs = [];
      array(size) {
        return new PgArrayBuilder(this.config.name, this, size);
      }
      references(ref, actions = {}) {
        this.foreignKeyConfigs.push({ ref, actions });
        return this;
      }
      unique(name, config) {
        this.config.isUnique = true;
        this.config.uniqueName = name;
        this.config.uniqueType = config?.nulls;
        return this;
      }
      /** @internal */
      buildForeignKeys(column, table) {
        return this.foreignKeyConfigs.map(({ ref, actions }) => {
          return iife(
            (ref2, actions2) => {
              const builder = new ForeignKeyBuilder(() => {
                const foreignColumn = ref2();
                return { columns: [column], foreignColumns: [foreignColumn] };
              });
              if (actions2.onUpdate) {
                builder.onUpdate(actions2.onUpdate);
              }
              if (actions2.onDelete) {
                builder.onDelete(actions2.onDelete);
              }
              return builder.build(table);
            },
            ref,
            actions
          );
        });
      }
    };
    _a15 = entityKind;
    __publicField(PgColumnBuilder, _a15, "PgColumnBuilder");
    PgColumn = class extends Column {
      constructor(table, config) {
        if (!config.uniqueName) {
          config.uniqueName = uniqueKeyName(table, [config.name]);
        }
        super(table, config);
        this.table = table;
      }
    };
    _a16 = entityKind;
    __publicField(PgColumn, _a16, "PgColumn");
    PgArrayBuilder = class extends PgColumnBuilder {
      constructor(name, baseBuilder, size) {
        super(name, "array", "PgArray");
        this.config.baseBuilder = baseBuilder;
        this.config.size = size;
      }
      /** @internal */
      build(table) {
        const baseColumn = this.config.baseBuilder.build(table);
        return new PgArray(
          table,
          this.config,
          baseColumn
        );
      }
    };
    _a17 = entityKind;
    __publicField(PgArrayBuilder, _a17, "PgArrayBuilder");
    _PgArray = class extends PgColumn {
      constructor(table, config, baseColumn, range) {
        super(table, config);
        this.baseColumn = baseColumn;
        this.range = range;
        this.size = config.size;
      }
      size;
      getSQLType() {
        return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
      }
      mapFromDriverValue(value) {
        if (typeof value === "string") {
          value = parsePgArray(value);
        }
        return value.map((v) => this.baseColumn.mapFromDriverValue(v));
      }
      mapToDriverValue(value, isNestedArray = false) {
        const a = value.map(
          (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
        );
        if (isNestedArray)
          return a;
        return makePgArray(a);
      }
    };
    PgArray = _PgArray;
    _a18 = entityKind;
    __publicField(PgArray, _a18, "PgArray");
  }
});
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var isPgEnumSym;
var _a19;
var PgEnumColumnBuilder;
var _a20;
var PgEnumColumn;
var init_enum = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/pg-core/columns/enum.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_common();
    isPgEnumSym = Symbol.for("drizzle:isPgEnum");
    PgEnumColumnBuilder = class extends PgColumnBuilder {
      constructor(name, enumInstance) {
        super(name, "string", "PgEnumColumn");
        this.config.enum = enumInstance;
      }
      /** @internal */
      build(table) {
        return new PgEnumColumn(
          table,
          this.config
        );
      }
    };
    _a19 = entityKind;
    __publicField(PgEnumColumnBuilder, _a19, "PgEnumColumnBuilder");
    PgEnumColumn = class extends PgColumn {
      enum = this.config.enum;
      enumValues = this.config.enum.enumValues;
      constructor(table, config) {
        super(table, config);
        this.enum = config.enum;
      }
      getSQLType() {
        return this.enum.enumName;
      }
    };
    _a20 = entityKind;
    __publicField(PgEnumColumn, _a20, "PgEnumColumn");
  }
});
var _a21;
var Subquery;
var _a22;
var WithSubquery;
var init_subquery = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/subquery.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    Subquery = class {
      constructor(sql2, selection, alias, isWith = false) {
        this._ = {
          brand: "Subquery",
          sql: sql2,
          selectedFields: selection,
          alias,
          isWith
        };
      }
      // getSQL(): SQL<unknown> {
      // 	return new SQL([this]);
      // }
    };
    _a21 = entityKind;
    __publicField(Subquery, _a21, "Subquery");
    WithSubquery = class extends Subquery {
    };
    _a22 = entityKind;
    __publicField(WithSubquery, _a22, "WithSubquery");
  }
});
var version;
var init_version = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/version.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    version = "0.30.10";
  }
});
var otel;
var rawTracer;
var tracer;
var init_tracing = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/tracing.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_tracing_utils();
    init_version();
    tracer = {
      startActiveSpan(name, fn) {
        if (!otel) {
          return fn();
        }
        if (!rawTracer) {
          rawTracer = otel.trace.getTracer("drizzle-orm", version);
        }
        return iife(
          (otel2, rawTracer2) => rawTracer2.startActiveSpan(
            name,
            (span) => {
              try {
                return fn(span);
              } catch (e) {
                span.setStatus({
                  code: otel2.SpanStatusCode.ERROR,
                  message: e instanceof Error ? e.message : "Unknown error"
                  // eslint-disable-line no-instanceof/no-instanceof
                });
                throw e;
              } finally {
                span.end();
              }
            }
          ),
          otel,
          rawTracer
        );
      }
    };
  }
});
var ViewBaseConfig;
var init_view_common = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/view-common.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");
  }
});
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    return p;
  });
}
var _a23;
var FakePrimitiveParam;
var _a24;
var StringChunk;
var _a25;
var _SQL;
var SQL;
var _a26;
var Name;
var noopDecoder;
var noopEncoder;
var noopMapper;
var _a27;
var Param;
var _a28;
var Placeholder;
var _a29;
var View;
var init_sql = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sql/sql.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_enum();
    init_subquery();
    init_tracing();
    init_view_common();
    init_column();
    init_table();
    FakePrimitiveParam = class {
    };
    _a23 = entityKind;
    __publicField(FakePrimitiveParam, _a23, "FakePrimitiveParam");
    StringChunk = class {
      value;
      constructor(value) {
        this.value = Array.isArray(value) ? value : [value];
      }
      getSQL() {
        return new SQL([this]);
      }
    };
    _a24 = entityKind;
    __publicField(StringChunk, _a24, "StringChunk");
    _SQL = class {
      constructor(queryChunks) {
        this.queryChunks = queryChunks;
      }
      /** @internal */
      decoder = noopDecoder;
      shouldInlineParams = false;
      append(query) {
        this.queryChunks.push(...query.queryChunks);
        return this;
      }
      toQuery(config) {
        return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
          const query = this.buildQueryFromSourceParams(this.queryChunks, config);
          span?.setAttributes({
            "drizzle.query.text": query.sql,
            "drizzle.query.params": JSON.stringify(query.params)
          });
          return query;
        });
      }
      buildQueryFromSourceParams(chunks, _config) {
        const config = Object.assign({}, _config, {
          inlineParams: _config.inlineParams || this.shouldInlineParams,
          paramStartIndex: _config.paramStartIndex || { value: 0 }
        });
        const {
          escapeName,
          escapeParam,
          prepareTyping,
          inlineParams,
          paramStartIndex
        } = config;
        return mergeQueries(chunks.map((chunk) => {
          if (is(chunk, StringChunk)) {
            return { sql: chunk.value.join(""), params: [] };
          }
          if (is(chunk, Name)) {
            return { sql: escapeName(chunk.value), params: [] };
          }
          if (chunk === void 0) {
            return { sql: "", params: [] };
          }
          if (Array.isArray(chunk)) {
            const result = [new StringChunk("(")];
            for (const [i, p] of chunk.entries()) {
              result.push(p);
              if (i < chunk.length - 1) {
                result.push(new StringChunk(", "));
              }
            }
            result.push(new StringChunk(")"));
            return this.buildQueryFromSourceParams(result, config);
          }
          if (is(chunk, _SQL)) {
            return this.buildQueryFromSourceParams(chunk.queryChunks, {
              ...config,
              inlineParams: inlineParams || chunk.shouldInlineParams
            });
          }
          if (is(chunk, Table)) {
            const schemaName = chunk[Table.Symbol.Schema];
            const tableName = chunk[Table.Symbol.Name];
            return {
              sql: schemaName === void 0 ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
              params: []
            };
          }
          if (is(chunk, Column)) {
            return { sql: escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(chunk.name), params: [] };
          }
          if (is(chunk, View)) {
            const schemaName = chunk[ViewBaseConfig].schema;
            const viewName = chunk[ViewBaseConfig].name;
            return {
              sql: schemaName === void 0 ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
              params: []
            };
          }
          if (is(chunk, Param)) {
            const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
            if (is(mappedValue, _SQL)) {
              return this.buildQueryFromSourceParams([mappedValue], config);
            }
            if (inlineParams) {
              return { sql: this.mapInlineParam(mappedValue, config), params: [] };
            }
            let typings;
            if (prepareTyping !== void 0) {
              typings = [prepareTyping(chunk.encoder)];
            }
            return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
          }
          if (is(chunk, Placeholder)) {
            return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk] };
          }
          if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
            return { sql: escapeName(chunk.fieldAlias), params: [] };
          }
          if (is(chunk, Subquery)) {
            if (chunk._.isWith) {
              return { sql: escapeName(chunk._.alias), params: [] };
            }
            return this.buildQueryFromSourceParams([
              new StringChunk("("),
              chunk._.sql,
              new StringChunk(") "),
              new Name(chunk._.alias)
            ], config);
          }
          if (isPgEnum(chunk)) {
            if (chunk.schema) {
              return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
            }
            return { sql: escapeName(chunk.enumName), params: [] };
          }
          if (isSQLWrapper(chunk)) {
            return this.buildQueryFromSourceParams([
              new StringChunk("("),
              chunk.getSQL(),
              new StringChunk(")")
            ], config);
          }
          if (inlineParams) {
            return { sql: this.mapInlineParam(chunk, config), params: [] };
          }
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk] };
        }));
      }
      mapInlineParam(chunk, { escapeString: escapeString2 }) {
        if (chunk === null) {
          return "null";
        }
        if (typeof chunk === "number" || typeof chunk === "boolean") {
          return chunk.toString();
        }
        if (typeof chunk === "string") {
          return escapeString2(chunk);
        }
        if (typeof chunk === "object") {
          const mappedValueAsString = chunk.toString();
          if (mappedValueAsString === "[object Object]") {
            return escapeString2(JSON.stringify(chunk));
          }
          return escapeString2(mappedValueAsString);
        }
        throw new Error("Unexpected param value: " + chunk);
      }
      getSQL() {
        return this;
      }
      as(alias) {
        if (alias === void 0) {
          return this;
        }
        return new _SQL.Aliased(this, alias);
      }
      mapWith(decoder) {
        this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
        return this;
      }
      inlineParams() {
        this.shouldInlineParams = true;
        return this;
      }
      /**
       * This method is used to conditionally include a part of the query.
       *
       * @param condition - Condition to check
       * @returns itself if the condition is `true`, otherwise `undefined`
       */
      if(condition) {
        return condition ? this : void 0;
      }
    };
    SQL = _SQL;
    _a25 = entityKind;
    __publicField(SQL, _a25, "SQL");
    Name = class {
      constructor(value) {
        this.value = value;
      }
      brand;
      getSQL() {
        return new SQL([this]);
      }
    };
    _a26 = entityKind;
    __publicField(Name, _a26, "Name");
    noopDecoder = {
      mapFromDriverValue: (value) => value
    };
    noopEncoder = {
      mapToDriverValue: (value) => value
    };
    noopMapper = {
      ...noopDecoder,
      ...noopEncoder
    };
    Param = class {
      /**
       * @param value - Parameter value
       * @param encoder - Encoder to convert the value to a driver parameter
       */
      constructor(value, encoder = noopEncoder) {
        this.value = value;
        this.encoder = encoder;
      }
      brand;
      getSQL() {
        return new SQL([this]);
      }
    };
    _a27 = entityKind;
    __publicField(Param, _a27, "Param");
    ((sql2) => {
      function empty() {
        return new SQL([]);
      }
      sql2.empty = empty;
      function fromList(list) {
        return new SQL(list);
      }
      sql2.fromList = fromList;
      function raw(str) {
        return new SQL([new StringChunk(str)]);
      }
      sql2.raw = raw;
      function join(chunks, separator) {
        const result = [];
        for (const [i, chunk] of chunks.entries()) {
          if (i > 0 && separator !== void 0) {
            result.push(separator);
          }
          result.push(chunk);
        }
        return new SQL(result);
      }
      sql2.join = join;
      function identifier(value) {
        return new Name(value);
      }
      sql2.identifier = identifier;
      function placeholder2(name2) {
        return new Placeholder(name2);
      }
      sql2.placeholder = placeholder2;
      function param2(value, encoder) {
        return new Param(value, encoder);
      }
      sql2.param = param2;
    })(sql || (sql = {}));
    ((SQL2) => {
      class Aliased {
        constructor(sql2, fieldAlias) {
          this.sql = sql2;
          this.fieldAlias = fieldAlias;
        }
        static [entityKind] = "SQL.Aliased";
        /** @internal */
        isSelectionField = false;
        getSQL() {
          return this.sql;
        }
        /** @internal */
        clone() {
          return new Aliased(this.sql, this.fieldAlias);
        }
      }
      SQL2.Aliased = Aliased;
    })(SQL || (SQL = {}));
    Placeholder = class {
      constructor(name2) {
        this.name = name2;
      }
      getSQL() {
        return new SQL([this]);
      }
    };
    _a28 = entityKind;
    __publicField(Placeholder, _a28, "Placeholder");
    View = class {
      /** @internal */
      [(_a29 = entityKind, ViewBaseConfig)];
      constructor({ name: name2, schema, selectedFields, query }) {
        this[ViewBaseConfig] = {
          name: name2,
          originalName: name2,
          schema,
          selectedFields,
          query,
          isExisting: !query,
          isAlias: false
        };
      }
      getSQL() {
        return new SQL([this]);
      }
    };
    __publicField(View, _a29, "View");
    Column.prototype.getSQL = function() {
      return new SQL([this]);
    };
    Table.prototype.getSQL = function() {
      return new SQL([this]);
    };
    Subquery.prototype.getSQL = function() {
      return new SQL([this]);
    };
  }
});
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error("inArray requires at least one value");
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error("notInArray requires at least one value");
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}
var eq;
var ne;
var gt;
var gte;
var lt;
var lte;
var init_conditions = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sql/expressions/conditions.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_column();
    init_entity();
    init_table();
    init_sql();
    eq = (left, right) => {
      return sql`${left} = ${bindIfParam(right, left)}`;
    };
    ne = (left, right) => {
      return sql`${left} <> ${bindIfParam(right, left)}`;
    };
    gt = (left, right) => {
      return sql`${left} > ${bindIfParam(right, left)}`;
    };
    gte = (left, right) => {
      return sql`${left} >= ${bindIfParam(right, left)}`;
    };
    lt = (left, right) => {
      return sql`${left} < ${bindIfParam(right, left)}`;
    };
    lte = (left, right) => {
      return sql`${left} <= ${bindIfParam(right, left)}`;
    };
  }
});
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}
var init_select = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sql/expressions/select.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_sql();
  }
});
var init_expressions = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sql/expressions/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_conditions();
    init_select();
  }
});
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (isTable(value)) {
      const dbName = value[Table.Symbol.Name];
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = value.table[Table.Symbol.Name];
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey2;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey2) {
            tableConfig.primaryKey.push(...primaryKey2);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey: primaryKey2
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function relations(table, relations2) {
  return new Relations(
    table,
    (helpers) => Object.fromEntries(
      Object.entries(relations2(helpers)).map(([key, value]) => [
        key,
        value.withFieldName(key)
      ])
    )
  );
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[relation.referencedTable[Table.Symbol.Name]];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[sourceTable[Table.Symbol.Name]];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}
var _a30;
var Relation;
var _a31;
var Relations;
var _a32;
var _One;
var One;
var _a33;
var _Many;
var Many;
var init_relations = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/relations.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_table();
    init_column();
    init_entity();
    init_primary_keys();
    init_expressions();
    init_sql();
    Relation = class {
      constructor(sourceTable, referencedTable, relationName) {
        this.sourceTable = sourceTable;
        this.referencedTable = referencedTable;
        this.relationName = relationName;
        this.referencedTableName = referencedTable[Table.Symbol.Name];
      }
      referencedTableName;
      fieldName;
    };
    _a30 = entityKind;
    __publicField(Relation, _a30, "Relation");
    Relations = class {
      constructor(table, config) {
        this.table = table;
        this.config = config;
      }
    };
    _a31 = entityKind;
    __publicField(Relations, _a31, "Relations");
    _One = class extends Relation {
      constructor(sourceTable, referencedTable, config, isNullable) {
        super(sourceTable, referencedTable, config?.relationName);
        this.config = config;
        this.isNullable = isNullable;
      }
      withFieldName(fieldName) {
        const relation = new _One(
          this.sourceTable,
          this.referencedTable,
          this.config,
          this.isNullable
        );
        relation.fieldName = fieldName;
        return relation;
      }
    };
    One = _One;
    _a32 = entityKind;
    __publicField(One, _a32, "One");
    _Many = class extends Relation {
      constructor(sourceTable, referencedTable, config) {
        super(sourceTable, referencedTable, config?.relationName);
        this.config = config;
      }
      withFieldName(fieldName) {
        const relation = new _Many(
          this.sourceTable,
          this.referencedTable,
          this.config
        );
        relation.fieldName = fieldName;
        return relation;
      }
    };
    Many = _Many;
    _a33 = entityKind;
    __publicField(Many, _a33, "Many");
  }
});
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}
var _a34;
var ColumnAliasProxyHandler;
var _a35;
var TableAliasProxyHandler;
var _a36;
var RelationTableAliasProxyHandler;
var init_alias = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/alias.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_column();
    init_entity();
    init_sql();
    init_table();
    init_view_common();
    ColumnAliasProxyHandler = class {
      constructor(table) {
        this.table = table;
      }
      get(columnObj, prop) {
        if (prop === "table") {
          return this.table;
        }
        return columnObj[prop];
      }
    };
    _a34 = entityKind;
    __publicField(ColumnAliasProxyHandler, _a34, "ColumnAliasProxyHandler");
    TableAliasProxyHandler = class {
      constructor(alias, replaceOriginalName) {
        this.alias = alias;
        this.replaceOriginalName = replaceOriginalName;
      }
      get(target, prop) {
        if (prop === Table.Symbol.IsAlias) {
          return true;
        }
        if (prop === Table.Symbol.Name) {
          return this.alias;
        }
        if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
          return this.alias;
        }
        if (prop === ViewBaseConfig) {
          return {
            ...target[ViewBaseConfig],
            name: this.alias,
            isAlias: true
          };
        }
        if (prop === Table.Symbol.Columns) {
          const columns = target[Table.Symbol.Columns];
          if (!columns) {
            return columns;
          }
          const proxiedColumns = {};
          Object.keys(columns).map((key) => {
            proxiedColumns[key] = new Proxy(
              columns[key],
              new ColumnAliasProxyHandler(new Proxy(target, this))
            );
          });
          return proxiedColumns;
        }
        const value = target[prop];
        if (is(value, Column)) {
          return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
        }
        return value;
      }
    };
    _a35 = entityKind;
    __publicField(TableAliasProxyHandler, _a35, "TableAliasProxyHandler");
    RelationTableAliasProxyHandler = class {
      constructor(alias) {
        this.alias = alias;
      }
      get(target, prop) {
        if (prop === "sourceTable") {
          return aliasedTable(target.sourceTable, this.alias);
        }
        return target[prop];
      }
    };
    _a36 = entityKind;
    __publicField(RelationTableAliasProxyHandler, _a36, "RelationTableAliasProxyHandler");
  }
});
var _a37;
var _SelectionProxyHandler;
var SelectionProxyHandler;
var init_selection_proxy = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/selection-proxy.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_alias();
    init_column();
    init_entity();
    init_sql();
    init_subquery();
    init_view_common();
    _SelectionProxyHandler = class {
      config;
      constructor(config) {
        this.config = { ...config };
      }
      get(subquery, prop) {
        if (prop === "_") {
          return {
            ...subquery["_"],
            selectedFields: new Proxy(
              subquery._.selectedFields,
              this
            )
          };
        }
        if (prop === ViewBaseConfig) {
          return {
            ...subquery[ViewBaseConfig],
            selectedFields: new Proxy(
              subquery[ViewBaseConfig].selectedFields,
              this
            )
          };
        }
        if (typeof prop === "symbol") {
          return subquery[prop];
        }
        const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
        const value = columns[prop];
        if (is(value, SQL.Aliased)) {
          if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
            return value.sql;
          }
          const newValue = value.clone();
          newValue.isSelectionField = true;
          return newValue;
        }
        if (is(value, SQL)) {
          if (this.config.sqlBehavior === "sql") {
            return value;
          }
          throw new Error(
            `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
          );
        }
        if (is(value, Column)) {
          if (this.config.alias) {
            return new Proxy(
              value,
              new ColumnAliasProxyHandler(
                new Proxy(
                  value.table,
                  new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
                )
              )
            );
          }
          return value;
        }
        if (typeof value !== "object" || value === null) {
          return value;
        }
        return new Proxy(value, new _SelectionProxyHandler(this.config));
      }
    };
    SelectionProxyHandler = _SelectionProxyHandler;
    _a37 = entityKind;
    __publicField(SelectionProxyHandler, _a37, "SelectionProxyHandler");
  }
});
var _a38;
var QueryPromise;
var init_query_promise = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/query-promise.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    QueryPromise = class {
      [(_a38 = entityKind, Symbol.toStringTag)] = "QueryPromise";
      catch(onRejected) {
        return this.then(void 0, onRejected);
      }
      finally(onFinally) {
        return this.then(
          (value) => {
            onFinally?.();
            return value;
          },
          (reason) => {
            onFinally?.();
            throw reason;
          }
        );
      }
      then(onFulfilled, onRejected) {
        return this.execute().then(onFulfilled, onRejected);
      }
    };
    __publicField(QueryPromise, _a38, "QueryPromise");
  }
});
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const builtColumns = Object.fromEntries(
    Object.entries(columns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys2].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
var InlineForeignKeys2;
var _a39;
var SQLiteTable;
var sqliteTable;
var init_table3 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/table.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_table();
    InlineForeignKeys2 = Symbol.for("drizzle:SQLiteInlineForeignKeys");
    SQLiteTable = class extends Table {
      /** @internal */
      [(_a39 = entityKind, Table.Symbol.Columns)];
      /** @internal */
      [InlineForeignKeys2] = [];
      /** @internal */
      [Table.Symbol.ExtraConfigBuilder] = void 0;
    };
    __publicField(SQLiteTable, _a39, "SQLiteTable");
    __publicField(SQLiteTable, "Symbol", Object.assign({}, Table.Symbol, {
      InlineForeignKeys: InlineForeignKeys2
    }));
    sqliteTable = (name, columns, extraConfig) => {
      return sqliteTableBase(name, columns, extraConfig);
    };
  }
});
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor")
        continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
var init_utils = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/utils.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_column();
    init_entity();
    init_sql();
    init_subquery();
    init_table();
    init_view_common();
  }
});
var _a40;
var SQLiteDeleteBase;
var init_delete = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/query-builders/delete.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_query_promise();
    init_table3();
    init_utils();
    SQLiteDeleteBase = class extends QueryPromise {
      constructor(table, session, dialect, withList) {
        super();
        this.table = table;
        this.session = session;
        this.dialect = dialect;
        this.config = { table, withList };
      }
      /** @internal */
      config;
      /**
       * Adds a `where` clause to the query.
       *
       * Calling this method will delete only those rows that fulfill a specified condition.
       *
       * See docs: {@link https://orm.drizzle.team/docs/delete}
       *
       * @param where the `where` clause.
       *
       * @example
       * You can use conditional operators and `sql function` to filter the rows to be deleted.
       *
       * ```ts
       * // Delete all cars with green color
       * db.delete(cars).where(eq(cars.color, 'green'));
       * // or
       * db.delete(cars).where(sql`${cars.color} = 'green'`)
       * ```
       *
       * You can logically combine conditional operators with `and()` and `or()` operators:
       *
       * ```ts
       * // Delete all BMW cars with a green color
       * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
       *
       * // Delete all cars with the green or blue color
       * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
       * ```
       */
      where(where) {
        this.config.where = where;
        return this;
      }
      returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
        this.config.returning = orderSelectedFields(fields);
        return this;
      }
      /** @internal */
      getSQL() {
        return this.dialect.buildDeleteQuery(this.config);
      }
      toSQL() {
        const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
        return rest;
      }
      /** @internal */
      _prepare(isOneTimeQuery = true) {
        return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          this.dialect.sqlToQuery(this.getSQL()),
          this.config.returning,
          this.config.returning ? "all" : "run",
          true
        );
      }
      prepare() {
        return this._prepare(false);
      }
      run = (placeholderValues) => {
        return this._prepare().run(placeholderValues);
      };
      all = (placeholderValues) => {
        return this._prepare().all(placeholderValues);
      };
      get = (placeholderValues) => {
        return this._prepare().get(placeholderValues);
      };
      values = (placeholderValues) => {
        return this._prepare().values(placeholderValues);
      };
      async execute(placeholderValues) {
        return this._prepare().execute(placeholderValues);
      }
      $dynamic() {
        return this;
      }
    };
    _a40 = entityKind;
    __publicField(SQLiteDeleteBase, _a40, "SQLiteDelete");
  }
});
var _a41;
var SQLiteInsertBuilder;
var _a42;
var SQLiteInsertBase;
var init_insert = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/query-builders/insert.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_query_promise();
    init_sql();
    init_table3();
    init_table();
    init_utils();
    SQLiteInsertBuilder = class {
      constructor(table, session, dialect, withList) {
        this.table = table;
        this.session = session;
        this.dialect = dialect;
        this.withList = withList;
      }
      values(values) {
        values = Array.isArray(values) ? values : [values];
        if (values.length === 0) {
          throw new Error("values() must be called with at least one value");
        }
        const mappedValues = values.map((entry) => {
          const result = {};
          const cols = this.table[Table.Symbol.Columns];
          for (const colKey of Object.keys(entry)) {
            const colValue = entry[colKey];
            result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
          }
          return result;
        });
        return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
      }
    };
    _a41 = entityKind;
    __publicField(SQLiteInsertBuilder, _a41, "SQLiteInsertBuilder");
    SQLiteInsertBase = class extends QueryPromise {
      constructor(table, values, session, dialect, withList) {
        super();
        this.session = session;
        this.dialect = dialect;
        this.config = { table, values, withList };
      }
      /** @internal */
      config;
      returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
        this.config.returning = orderSelectedFields(fields);
        return this;
      }
      /**
       * Adds an `on conflict do nothing` clause to the query.
       *
       * Calling this method simply avoids inserting a row as its alternative action.
       *
       * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
       *
       * @param config The `target` and `where` clauses.
       *
       * @example
       * ```ts
       * // Insert one row and cancel the insert if there's a conflict
       * await db.insert(cars)
       *   .values({ id: 1, brand: 'BMW' })
       *   .onConflictDoNothing();
       *
       * // Explicitly specify conflict target
       * await db.insert(cars)
       *   .values({ id: 1, brand: 'BMW' })
       *   .onConflictDoNothing({ target: cars.id });
       * ```
       */
      onConflictDoNothing(config = {}) {
        if (config.target === void 0) {
          this.config.onConflict = sql`do nothing`;
        } else {
          const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
          const whereSql = config.where ? sql` where ${config.where}` : sql``;
          this.config.onConflict = sql`${targetSql} do nothing${whereSql}`;
        }
        return this;
      }
      /**
       * Adds an `on conflict do update` clause to the query.
       *
       * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
       *
       * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
       *
       * @param config The `target`, `set` and `where` clauses.
       *
       * @example
       * ```ts
       * // Update the row if there's a conflict
       * await db.insert(cars)
       *   .values({ id: 1, brand: 'BMW' })
       *   .onConflictDoUpdate({
       *     target: cars.id,
       *     set: { brand: 'Porsche' }
       *   });
       *
       * // Upsert with 'where' clause
       * await db.insert(cars)
       *   .values({ id: 1, brand: 'BMW' })
       *   .onConflictDoUpdate({
       *     target: cars.id,
       *     set: { brand: 'newBMW' },
       *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
       *   });
       * ```
       */
      onConflictDoUpdate(config) {
        if (config.where && (config.targetWhere || config.setWhere)) {
          throw new Error(
            'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
          );
        }
        const whereSql = config.where ? sql` where ${config.where}` : void 0;
        const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
        const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
        const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
        const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
        this.config.onConflict = sql`${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`;
        return this;
      }
      /** @internal */
      getSQL() {
        return this.dialect.buildInsertQuery(this.config);
      }
      toSQL() {
        const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
        return rest;
      }
      /** @internal */
      _prepare(isOneTimeQuery = true) {
        return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          this.dialect.sqlToQuery(this.getSQL()),
          this.config.returning,
          this.config.returning ? "all" : "run",
          true
        );
      }
      prepare() {
        return this._prepare(false);
      }
      run = (placeholderValues) => {
        return this._prepare().run(placeholderValues);
      };
      all = (placeholderValues) => {
        return this._prepare().all(placeholderValues);
      };
      get = (placeholderValues) => {
        return this._prepare().get(placeholderValues);
      };
      values = (placeholderValues) => {
        return this._prepare().values(placeholderValues);
      };
      async execute() {
        return this.config.returning ? this.all() : this.run();
      }
      $dynamic() {
        return this;
      }
    };
    _a42 = entityKind;
    __publicField(SQLiteInsertBase, _a42, "SQLiteInsert");
  }
});
var _a43;
var DrizzleError;
var _a44;
var TransactionRollbackError;
var init_errors = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/errors.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    DrizzleError = class extends Error {
      constructor({ message, cause }) {
        super(message);
        this.name = "DrizzleError";
        this.cause = cause;
      }
    };
    _a43 = entityKind;
    __publicField(DrizzleError, _a43, "DrizzleError");
    TransactionRollbackError = class extends DrizzleError {
      constructor() {
        super({ message: "Rollback" });
      }
    };
    _a44 = entityKind;
    __publicField(TransactionRollbackError, _a44, "TransactionRollbackError");
  }
});
var init_aggregate = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sql/functions/aggregate.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
var init_functions = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sql/functions/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_aggregate();
  }
});
var init_sql2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sql/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_expressions();
    init_functions();
    init_sql();
  }
});
var _a45;
var ForeignKeyBuilder2;
var _a46;
var ForeignKey2;
var init_foreign_keys2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/foreign-keys.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_table3();
    ForeignKeyBuilder2 = class {
      /** @internal */
      reference;
      /** @internal */
      _onUpdate;
      /** @internal */
      _onDelete;
      constructor(config, actions) {
        this.reference = () => {
          const { name, columns, foreignColumns } = config();
          return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
        };
        if (actions) {
          this._onUpdate = actions.onUpdate;
          this._onDelete = actions.onDelete;
        }
      }
      onUpdate(action) {
        this._onUpdate = action;
        return this;
      }
      onDelete(action) {
        this._onDelete = action;
        return this;
      }
      /** @internal */
      build(table) {
        return new ForeignKey2(table, this);
      }
    };
    _a45 = entityKind;
    __publicField(ForeignKeyBuilder2, _a45, "SQLiteForeignKeyBuilder");
    ForeignKey2 = class {
      constructor(table, builder) {
        this.table = table;
        this.reference = builder.reference;
        this.onUpdate = builder._onUpdate;
        this.onDelete = builder._onDelete;
      }
      reference;
      onUpdate;
      onDelete;
      getName() {
        const { name, columns, foreignColumns } = this.reference();
        const columnNames = columns.map((column) => column.name);
        const foreignColumnNames = foreignColumns.map((column) => column.name);
        const chunks = [
          this.table[SQLiteTable.Symbol.Name],
          ...columnNames,
          foreignColumns[0].table[SQLiteTable.Symbol.Name],
          ...foreignColumnNames
        ];
        return name ?? `${chunks.join("_")}_fk`;
      }
    };
    _a46 = entityKind;
    __publicField(ForeignKey2, _a46, "SQLiteForeignKey");
  }
});
function uniqueKeyName2(table, columns) {
  return `${table[SQLiteTable.Symbol.Name]}_${columns.join("_")}_unique`;
}
var _a47;
var UniqueConstraintBuilder2;
var _a48;
var UniqueOnConstraintBuilder2;
var _a49;
var UniqueConstraint2;
var init_unique_constraint2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/unique-constraint.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_table3();
    UniqueConstraintBuilder2 = class {
      constructor(columns, name) {
        this.name = name;
        this.columns = columns;
      }
      /** @internal */
      columns;
      /** @internal */
      build(table) {
        return new UniqueConstraint2(table, this.columns, this.name);
      }
    };
    _a47 = entityKind;
    __publicField(UniqueConstraintBuilder2, _a47, "SQLiteUniqueConstraintBuilder");
    UniqueOnConstraintBuilder2 = class {
      /** @internal */
      name;
      constructor(name) {
        this.name = name;
      }
      on(...columns) {
        return new UniqueConstraintBuilder2(columns, this.name);
      }
    };
    _a48 = entityKind;
    __publicField(UniqueOnConstraintBuilder2, _a48, "SQLiteUniqueOnConstraintBuilder");
    UniqueConstraint2 = class {
      constructor(table, columns, name) {
        this.table = table;
        this.columns = columns;
        this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
      }
      columns;
      name;
      getName() {
        return this.name;
      }
    };
    _a49 = entityKind;
    __publicField(UniqueConstraint2, _a49, "SQLiteUniqueConstraint");
  }
});
var _a50;
var SQLiteColumnBuilder;
var _a51;
var SQLiteColumn;
var init_common2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/columns/common.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_column_builder();
    init_column();
    init_entity();
    init_foreign_keys2();
    init_unique_constraint2();
    SQLiteColumnBuilder = class extends ColumnBuilder {
      foreignKeyConfigs = [];
      references(ref, actions = {}) {
        this.foreignKeyConfigs.push({ ref, actions });
        return this;
      }
      unique(name) {
        this.config.isUnique = true;
        this.config.uniqueName = name;
        return this;
      }
      /** @internal */
      buildForeignKeys(column, table) {
        return this.foreignKeyConfigs.map(({ ref, actions }) => {
          return ((ref2, actions2) => {
            const builder = new ForeignKeyBuilder2(() => {
              const foreignColumn = ref2();
              return { columns: [column], foreignColumns: [foreignColumn] };
            });
            if (actions2.onUpdate) {
              builder.onUpdate(actions2.onUpdate);
            }
            if (actions2.onDelete) {
              builder.onDelete(actions2.onDelete);
            }
            return builder.build(table);
          })(ref, actions);
        });
      }
    };
    _a50 = entityKind;
    __publicField(SQLiteColumnBuilder, _a50, "SQLiteColumnBuilder");
    SQLiteColumn = class extends Column {
      constructor(table, config) {
        if (!config.uniqueName) {
          config.uniqueName = uniqueKeyName2(table, [config.name]);
        }
        super(table, config);
        this.table = table;
      }
    };
    _a51 = entityKind;
    __publicField(SQLiteColumn, _a51, "SQLiteColumn");
  }
});
var _a52;
var SQLiteBigIntBuilder;
var _a53;
var SQLiteBigInt;
var _a54;
var SQLiteBlobJsonBuilder;
var _a55;
var SQLiteBlobJson;
var _a56;
var SQLiteBlobBufferBuilder;
var _a57;
var SQLiteBlobBuffer;
var init_blob = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/columns/blob.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_common2();
    SQLiteBigIntBuilder = class extends SQLiteColumnBuilder {
      constructor(name) {
        super(name, "bigint", "SQLiteBigInt");
      }
      /** @internal */
      build(table) {
        return new SQLiteBigInt(table, this.config);
      }
    };
    _a52 = entityKind;
    __publicField(SQLiteBigIntBuilder, _a52, "SQLiteBigIntBuilder");
    SQLiteBigInt = class extends SQLiteColumn {
      getSQLType() {
        return "blob";
      }
      mapFromDriverValue(value) {
        return BigInt(value.toString());
      }
      mapToDriverValue(value) {
        return Buffer.from(value.toString());
      }
    };
    _a53 = entityKind;
    __publicField(SQLiteBigInt, _a53, "SQLiteBigInt");
    SQLiteBlobJsonBuilder = class extends SQLiteColumnBuilder {
      constructor(name) {
        super(name, "json", "SQLiteBlobJson");
      }
      /** @internal */
      build(table) {
        return new SQLiteBlobJson(
          table,
          this.config
        );
      }
    };
    _a54 = entityKind;
    __publicField(SQLiteBlobJsonBuilder, _a54, "SQLiteBlobJsonBuilder");
    SQLiteBlobJson = class extends SQLiteColumn {
      getSQLType() {
        return "blob";
      }
      mapFromDriverValue(value) {
        return JSON.parse(value.toString());
      }
      mapToDriverValue(value) {
        return Buffer.from(JSON.stringify(value));
      }
    };
    _a55 = entityKind;
    __publicField(SQLiteBlobJson, _a55, "SQLiteBlobJson");
    SQLiteBlobBufferBuilder = class extends SQLiteColumnBuilder {
      constructor(name) {
        super(name, "buffer", "SQLiteBlobBuffer");
      }
      /** @internal */
      build(table) {
        return new SQLiteBlobBuffer(table, this.config);
      }
    };
    _a56 = entityKind;
    __publicField(SQLiteBlobBufferBuilder, _a56, "SQLiteBlobBufferBuilder");
    SQLiteBlobBuffer = class extends SQLiteColumn {
      getSQLType() {
        return "blob";
      }
    };
    _a57 = entityKind;
    __publicField(SQLiteBlobBuffer, _a57, "SQLiteBlobBuffer");
  }
});
var _a58;
var SQLiteCustomColumnBuilder;
var _a59;
var SQLiteCustomColumn;
var init_custom = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/columns/custom.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_common2();
    SQLiteCustomColumnBuilder = class extends SQLiteColumnBuilder {
      constructor(name, fieldConfig, customTypeParams) {
        super(name, "custom", "SQLiteCustomColumn");
        this.config.fieldConfig = fieldConfig;
        this.config.customTypeParams = customTypeParams;
      }
      /** @internal */
      build(table) {
        return new SQLiteCustomColumn(
          table,
          this.config
        );
      }
    };
    _a58 = entityKind;
    __publicField(SQLiteCustomColumnBuilder, _a58, "SQLiteCustomColumnBuilder");
    SQLiteCustomColumn = class extends SQLiteColumn {
      sqlName;
      mapTo;
      mapFrom;
      constructor(table, config) {
        super(table, config);
        this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
        this.mapTo = config.customTypeParams.toDriver;
        this.mapFrom = config.customTypeParams.fromDriver;
      }
      getSQLType() {
        return this.sqlName;
      }
      mapFromDriverValue(value) {
        return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
      }
      mapToDriverValue(value) {
        return typeof this.mapTo === "function" ? this.mapTo(value) : value;
      }
    };
    _a59 = entityKind;
    __publicField(SQLiteCustomColumn, _a59, "SQLiteCustomColumn");
  }
});
function integer(name, config) {
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
var _a60;
var SQLiteBaseIntegerBuilder;
var _a61;
var SQLiteBaseInteger;
var _a62;
var SQLiteIntegerBuilder;
var _a63;
var SQLiteInteger;
var _a64;
var SQLiteTimestampBuilder;
var _a65;
var SQLiteTimestamp;
var _a66;
var SQLiteBooleanBuilder;
var _a67;
var SQLiteBoolean;
var init_integer = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/columns/integer.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_sql();
    init_common2();
    SQLiteBaseIntegerBuilder = class extends SQLiteColumnBuilder {
      constructor(name, dataType, columnType) {
        super(name, dataType, columnType);
        this.config.autoIncrement = false;
      }
      primaryKey(config) {
        if (config?.autoIncrement) {
          this.config.autoIncrement = true;
        }
        this.config.hasDefault = true;
        return super.primaryKey();
      }
    };
    _a60 = entityKind;
    __publicField(SQLiteBaseIntegerBuilder, _a60, "SQLiteBaseIntegerBuilder");
    SQLiteBaseInteger = class extends SQLiteColumn {
      autoIncrement = this.config.autoIncrement;
      getSQLType() {
        return "integer";
      }
    };
    _a61 = entityKind;
    __publicField(SQLiteBaseInteger, _a61, "SQLiteBaseInteger");
    SQLiteIntegerBuilder = class extends SQLiteBaseIntegerBuilder {
      constructor(name) {
        super(name, "number", "SQLiteInteger");
      }
      build(table) {
        return new SQLiteInteger(
          table,
          this.config
        );
      }
    };
    _a62 = entityKind;
    __publicField(SQLiteIntegerBuilder, _a62, "SQLiteIntegerBuilder");
    SQLiteInteger = class extends SQLiteBaseInteger {
    };
    _a63 = entityKind;
    __publicField(SQLiteInteger, _a63, "SQLiteInteger");
    SQLiteTimestampBuilder = class extends SQLiteBaseIntegerBuilder {
      constructor(name, mode) {
        super(name, "date", "SQLiteTimestamp");
        this.config.mode = mode;
      }
      /**
       * @deprecated Use `default()` with your own expression instead.
       *
       * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
       */
      defaultNow() {
        return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
      }
      build(table) {
        return new SQLiteTimestamp(
          table,
          this.config
        );
      }
    };
    _a64 = entityKind;
    __publicField(SQLiteTimestampBuilder, _a64, "SQLiteTimestampBuilder");
    SQLiteTimestamp = class extends SQLiteBaseInteger {
      mode = this.config.mode;
      mapFromDriverValue(value) {
        if (this.config.mode === "timestamp") {
          return new Date(value * 1e3);
        }
        return new Date(value);
      }
      mapToDriverValue(value) {
        const unix = value.getTime();
        if (this.config.mode === "timestamp") {
          return Math.floor(unix / 1e3);
        }
        return unix;
      }
    };
    _a65 = entityKind;
    __publicField(SQLiteTimestamp, _a65, "SQLiteTimestamp");
    SQLiteBooleanBuilder = class extends SQLiteBaseIntegerBuilder {
      constructor(name, mode) {
        super(name, "boolean", "SQLiteBoolean");
        this.config.mode = mode;
      }
      build(table) {
        return new SQLiteBoolean(
          table,
          this.config
        );
      }
    };
    _a66 = entityKind;
    __publicField(SQLiteBooleanBuilder, _a66, "SQLiteBooleanBuilder");
    SQLiteBoolean = class extends SQLiteBaseInteger {
      mode = this.config.mode;
      mapFromDriverValue(value) {
        return Number(value) === 1;
      }
      mapToDriverValue(value) {
        return value ? 1 : 0;
      }
    };
    _a67 = entityKind;
    __publicField(SQLiteBoolean, _a67, "SQLiteBoolean");
  }
});
var _a68;
var SQLiteNumericBuilder;
var _a69;
var SQLiteNumeric;
var init_numeric = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/columns/numeric.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_common2();
    SQLiteNumericBuilder = class extends SQLiteColumnBuilder {
      constructor(name) {
        super(name, "string", "SQLiteNumeric");
      }
      /** @internal */
      build(table) {
        return new SQLiteNumeric(
          table,
          this.config
        );
      }
    };
    _a68 = entityKind;
    __publicField(SQLiteNumericBuilder, _a68, "SQLiteNumericBuilder");
    SQLiteNumeric = class extends SQLiteColumn {
      getSQLType() {
        return "numeric";
      }
    };
    _a69 = entityKind;
    __publicField(SQLiteNumeric, _a69, "SQLiteNumeric");
  }
});
var _a70;
var SQLiteRealBuilder;
var _a71;
var SQLiteReal;
var init_real = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/columns/real.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_common2();
    SQLiteRealBuilder = class extends SQLiteColumnBuilder {
      constructor(name) {
        super(name, "number", "SQLiteReal");
      }
      /** @internal */
      build(table) {
        return new SQLiteReal(table, this.config);
      }
    };
    _a70 = entityKind;
    __publicField(SQLiteRealBuilder, _a70, "SQLiteRealBuilder");
    SQLiteReal = class extends SQLiteColumn {
      getSQLType() {
        return "real";
      }
    };
    _a71 = entityKind;
    __publicField(SQLiteReal, _a71, "SQLiteReal");
  }
});
function text(name, config = {}) {
  return config.mode === "json" ? new SQLiteTextJsonBuilder(name) : new SQLiteTextBuilder(name, config);
}
var _a72;
var SQLiteTextBuilder;
var _a73;
var SQLiteText;
var _a74;
var SQLiteTextJsonBuilder;
var _a75;
var SQLiteTextJson;
var init_text = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/columns/text.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_common2();
    SQLiteTextBuilder = class extends SQLiteColumnBuilder {
      constructor(name, config) {
        super(name, "string", "SQLiteText");
        this.config.enumValues = config.enum;
        this.config.length = config.length;
      }
      /** @internal */
      build(table) {
        return new SQLiteText(table, this.config);
      }
    };
    _a72 = entityKind;
    __publicField(SQLiteTextBuilder, _a72, "SQLiteTextBuilder");
    SQLiteText = class extends SQLiteColumn {
      enumValues = this.config.enumValues;
      length = this.config.length;
      constructor(table, config) {
        super(table, config);
      }
      getSQLType() {
        return `text${this.config.length ? `(${this.config.length})` : ""}`;
      }
    };
    _a73 = entityKind;
    __publicField(SQLiteText, _a73, "SQLiteText");
    SQLiteTextJsonBuilder = class extends SQLiteColumnBuilder {
      constructor(name) {
        super(name, "json", "SQLiteTextJson");
      }
      /** @internal */
      build(table) {
        return new SQLiteTextJson(
          table,
          this.config
        );
      }
    };
    _a74 = entityKind;
    __publicField(SQLiteTextJsonBuilder, _a74, "SQLiteTextJsonBuilder");
    SQLiteTextJson = class extends SQLiteColumn {
      getSQLType() {
        return "text";
      }
      mapFromDriverValue(value) {
        return JSON.parse(value);
      }
      mapToDriverValue(value) {
        return JSON.stringify(value);
      }
    };
    _a75 = entityKind;
    __publicField(SQLiteTextJson, _a75, "SQLiteTextJson");
  }
});
var init_columns = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/columns/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_blob();
    init_common2();
    init_custom();
    init_integer();
    init_numeric();
    init_real();
    init_text();
  }
});
var _a76;
var SQLiteViewBase;
var init_view_base = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/view-base.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_sql();
    SQLiteViewBase = class extends View {
    };
    _a76 = entityKind;
    __publicField(SQLiteViewBase, _a76, "SQLiteViewBase");
  }
});
var _a77;
var SQLiteDialect;
var _a78;
var SQLiteSyncDialect;
var _a79;
var SQLiteAsyncDialect;
var init_dialect = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/dialect.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_alias();
    init_column();
    init_entity();
    init_errors();
    init_relations();
    init_sql2();
    init_sql();
    init_columns();
    init_table3();
    init_subquery();
    init_table();
    init_utils();
    init_view_common();
    init_view_base();
    SQLiteDialect = class {
      escapeName(name) {
        return `"${name}"`;
      }
      escapeParam(_num) {
        return "?";
      }
      escapeString(str) {
        return `'${str.replace(/'/g, "''")}'`;
      }
      buildWithCTE(queries) {
        if (!queries?.length)
          return void 0;
        const withSqlChunks = [sql`with `];
        for (const [i, w] of queries.entries()) {
          withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
          if (i < queries.length - 1) {
            withSqlChunks.push(sql`, `);
          }
        }
        withSqlChunks.push(sql` `);
        return sql.join(withSqlChunks);
      }
      buildDeleteQuery({ table, where, returning, withList }) {
        const withSql = this.buildWithCTE(withList);
        const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
        const whereSql = where ? sql` where ${where}` : void 0;
        return sql`${withSql}delete from ${table}${whereSql}${returningSql}`;
      }
      buildUpdateSet(table, set) {
        const tableColumns = table[Table.Symbol.Columns];
        const columnNames = Object.keys(tableColumns).filter(
          (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
        );
        const setSize = columnNames.length;
        return sql.join(columnNames.flatMap((colName, i) => {
          const col = tableColumns[colName];
          const value = set[colName] ?? sql.param(col.onUpdateFn(), col);
          const res = sql`${sql.identifier(col.name)} = ${value}`;
          if (i < setSize - 1) {
            return [res, sql.raw(", ")];
          }
          return [res];
        }));
      }
      buildUpdateQuery({ table, set, where, returning, withList }) {
        const withSql = this.buildWithCTE(withList);
        const setSql = this.buildUpdateSet(table, set);
        const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
        const whereSql = where ? sql` where ${where}` : void 0;
        return sql`${withSql}update ${table} set ${setSql}${whereSql}${returningSql}`;
      }
      /**
       * Builds selection SQL with provided fields/expressions
       *
       * Examples:
       *
       * `select <selection> from`
       *
       * `insert ... returning <selection>`
       *
       * If `isSingleTable` is true, then columns won't be prefixed with table name
       */
      buildSelection(fields, { isSingleTable = false } = {}) {
        const columnsLen = fields.length;
        const chunks = fields.flatMap(({ field }, i) => {
          const chunk = [];
          if (is(field, SQL.Aliased) && field.isSelectionField) {
            chunk.push(sql.identifier(field.fieldAlias));
          } else if (is(field, SQL.Aliased) || is(field, SQL)) {
            const query = is(field, SQL.Aliased) ? field.sql : field;
            if (isSingleTable) {
              chunk.push(
                new SQL(
                  query.queryChunks.map((c) => {
                    if (is(c, Column)) {
                      return sql.identifier(c.name);
                    }
                    return c;
                  })
                )
              );
            } else {
              chunk.push(query);
            }
            if (is(field, SQL.Aliased)) {
              chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
            }
          } else if (is(field, Column)) {
            const tableName = field.table[Table.Symbol.Name];
            const columnName = field.name;
            if (isSingleTable) {
              chunk.push(sql.identifier(columnName));
            } else {
              chunk.push(sql`${sql.identifier(tableName)}.${sql.identifier(columnName)}`);
            }
          }
          if (i < columnsLen - 1) {
            chunk.push(sql`, `);
          }
          return chunk;
        });
        return sql.join(chunks);
      }
      buildSelectQuery({
        withList,
        fields,
        fieldsFlat,
        where,
        having,
        table,
        joins,
        orderBy,
        groupBy,
        limit,
        offset,
        distinct,
        setOperators
      }) {
        const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
        for (const f of fieldsList) {
          if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
            ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
          ))(f.field.table)) {
            const tableName = getTableName(f.field.table);
            throw new Error(
              `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
            );
          }
        }
        const isSingleTable = !joins || joins.length === 0;
        const withSql = this.buildWithCTE(withList);
        const distinctSql = distinct ? sql` distinct` : void 0;
        const selection = this.buildSelection(fieldsList, { isSingleTable });
        const tableSql = (() => {
          if (is(table, Table) && table[Table.Symbol.OriginalName] !== table[Table.Symbol.Name]) {
            return sql`${sql.identifier(table[Table.Symbol.OriginalName])} ${sql.identifier(table[Table.Symbol.Name])}`;
          }
          return table;
        })();
        const joinsArray = [];
        if (joins) {
          for (const [index, joinMeta] of joins.entries()) {
            if (index === 0) {
              joinsArray.push(sql` `);
            }
            const table2 = joinMeta.table;
            if (is(table2, SQLiteTable)) {
              const tableName = table2[SQLiteTable.Symbol.Name];
              const tableSchema = table2[SQLiteTable.Symbol.Schema];
              const origTableName = table2[SQLiteTable.Symbol.OriginalName];
              const alias = tableName === origTableName ? void 0 : joinMeta.alias;
              joinsArray.push(
                sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`} on ${joinMeta.on}`
              );
            } else {
              joinsArray.push(
                sql`${sql.raw(joinMeta.joinType)} join ${table2} on ${joinMeta.on}`
              );
            }
            if (index < joins.length - 1) {
              joinsArray.push(sql` `);
            }
          }
        }
        const joinsSql = sql.join(joinsArray);
        const whereSql = where ? sql` where ${where}` : void 0;
        const havingSql = having ? sql` having ${having}` : void 0;
        const orderByList = [];
        if (orderBy) {
          for (const [index, orderByValue] of orderBy.entries()) {
            orderByList.push(orderByValue);
            if (index < orderBy.length - 1) {
              orderByList.push(sql`, `);
            }
          }
        }
        const groupByList = [];
        if (groupBy) {
          for (const [index, groupByValue] of groupBy.entries()) {
            groupByList.push(groupByValue);
            if (index < groupBy.length - 1) {
              groupByList.push(sql`, `);
            }
          }
        }
        const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
        const orderBySql = orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
        const limitSql = limit ? sql` limit ${limit}` : void 0;
        const offsetSql = offset ? sql` offset ${offset}` : void 0;
        const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
        if (setOperators.length > 0) {
          return this.buildSetOperations(finalQuery, setOperators);
        }
        return finalQuery;
      }
      buildSetOperations(leftSelect, setOperators) {
        const [setOperator, ...rest] = setOperators;
        if (!setOperator) {
          throw new Error("Cannot pass undefined values to any set operator");
        }
        if (rest.length === 0) {
          return this.buildSetOperationQuery({ leftSelect, setOperator });
        }
        return this.buildSetOperations(
          this.buildSetOperationQuery({ leftSelect, setOperator }),
          rest
        );
      }
      buildSetOperationQuery({
        leftSelect,
        setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
      }) {
        const leftChunk = sql`${leftSelect.getSQL()} `;
        const rightChunk = sql`${rightSelect.getSQL()}`;
        let orderBySql;
        if (orderBy && orderBy.length > 0) {
          const orderByValues = [];
          for (const singleOrderBy of orderBy) {
            if (is(singleOrderBy, SQLiteColumn)) {
              orderByValues.push(sql.identifier(singleOrderBy.name));
            } else if (is(singleOrderBy, SQL)) {
              for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
                const chunk = singleOrderBy.queryChunks[i];
                if (is(chunk, SQLiteColumn)) {
                  singleOrderBy.queryChunks[i] = sql.identifier(chunk.name);
                }
              }
              orderByValues.push(sql`${singleOrderBy}`);
            } else {
              orderByValues.push(sql`${singleOrderBy}`);
            }
          }
          orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
        }
        const limitSql = limit ? sql` limit ${limit}` : void 0;
        const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
        const offsetSql = offset ? sql` offset ${offset}` : void 0;
        return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
      }
      buildInsertQuery({ table, values, onConflict, returning, withList }) {
        const valuesSqlList = [];
        const columns = table[Table.Symbol.Columns];
        const colEntries = Object.entries(columns);
        const insertOrder = colEntries.map(([, column]) => sql.identifier(column.name));
        for (const [valueIndex, value] of values.entries()) {
          const valueList = [];
          for (const [fieldName, col] of colEntries) {
            const colValue = value[fieldName];
            if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
              let defaultValue;
              if (col.default !== null && col.default !== void 0) {
                defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
              } else if (col.defaultFn !== void 0) {
                const defaultFnResult = col.defaultFn();
                defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
              } else if (!col.default && col.onUpdateFn !== void 0) {
                const onUpdateFnResult = col.onUpdateFn();
                defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
              } else {
                defaultValue = sql`null`;
              }
              valueList.push(defaultValue);
            } else {
              valueList.push(colValue);
            }
          }
          valuesSqlList.push(valueList);
          if (valueIndex < values.length - 1) {
            valuesSqlList.push(sql`, `);
          }
        }
        const withSql = this.buildWithCTE(withList);
        const valuesSql = sql.join(valuesSqlList);
        const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
        const onConflictSql = onConflict ? sql` on conflict ${onConflict}` : void 0;
        return sql`${withSql}insert into ${table} ${insertOrder} values ${valuesSql}${onConflictSql}${returningSql}`;
      }
      sqlToQuery(sql2) {
        return sql2.toQuery({
          escapeName: this.escapeName,
          escapeParam: this.escapeParam,
          escapeString: this.escapeString
        });
      }
      buildRelationalQuery({
        fullSchema,
        schema,
        tableNamesMap,
        table,
        tableConfig,
        queryConfig: config,
        tableAlias,
        nestedQueryRelation,
        joinOn
      }) {
        let selection = [];
        let limit, offset, orderBy = [], where;
        const joins = [];
        if (config === true) {
          const selectionEntries = Object.entries(tableConfig.columns);
          selection = selectionEntries.map(([key, value]) => ({
            dbKey: value.name,
            tsKey: key,
            field: aliasedTableColumn(value, tableAlias),
            relationTableTsKey: void 0,
            isJson: false,
            selection: []
          }));
        } else {
          const aliasedColumns = Object.fromEntries(
            Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
          );
          if (config.where) {
            const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
            where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
          }
          const fieldsSelection = [];
          let selectedColumns = [];
          if (config.columns) {
            let isIncludeMode = false;
            for (const [field, value] of Object.entries(config.columns)) {
              if (value === void 0) {
                continue;
              }
              if (field in tableConfig.columns) {
                if (!isIncludeMode && value === true) {
                  isIncludeMode = true;
                }
                selectedColumns.push(field);
              }
            }
            if (selectedColumns.length > 0) {
              selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
            }
          } else {
            selectedColumns = Object.keys(tableConfig.columns);
          }
          for (const field of selectedColumns) {
            const column = tableConfig.columns[field];
            fieldsSelection.push({ tsKey: field, value: column });
          }
          let selectedRelations = [];
          if (config.with) {
            selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
          }
          let extras;
          if (config.extras) {
            extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
            for (const [tsKey, value] of Object.entries(extras)) {
              fieldsSelection.push({
                tsKey,
                value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
              });
            }
          }
          for (const { tsKey, value } of fieldsSelection) {
            selection.push({
              dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
              tsKey,
              field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
              relationTableTsKey: void 0,
              isJson: false,
              selection: []
            });
          }
          let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
          if (!Array.isArray(orderByOrig)) {
            orderByOrig = [orderByOrig];
          }
          orderBy = orderByOrig.map((orderByValue) => {
            if (is(orderByValue, Column)) {
              return aliasedTableColumn(orderByValue, tableAlias);
            }
            return mapColumnsInSQLToAlias(orderByValue, tableAlias);
          });
          limit = config.limit;
          offset = config.offset;
          for (const {
            tsKey: selectedRelationTsKey,
            queryConfig: selectedRelationConfigValue,
            relation
          } of selectedRelations) {
            const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
            const relationTableName = relation.referencedTable[Table.Symbol.Name];
            const relationTableTsName = tableNamesMap[relationTableName];
            const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
            const joinOn2 = and(
              ...normalizedRelation.fields.map(
                (field2, i) => eq(
                  aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
                  aliasedTableColumn(field2, tableAlias)
                )
              )
            );
            const builtRelation = this.buildRelationalQuery({
              fullSchema,
              schema,
              tableNamesMap,
              table: fullSchema[relationTableTsName],
              tableConfig: schema[relationTableTsName],
              queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
              tableAlias: relationTableAlias,
              joinOn: joinOn2,
              nestedQueryRelation: relation
            });
            const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
            selection.push({
              dbKey: selectedRelationTsKey,
              tsKey: selectedRelationTsKey,
              field,
              relationTableTsKey: relationTableTsName,
              isJson: true,
              selection: builtRelation.selection
            });
          }
        }
        if (selection.length === 0) {
          throw new DrizzleError({
            message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
          });
        }
        let result;
        where = and(joinOn, where);
        if (nestedQueryRelation) {
          let field = sql`json_array(${sql.join(
            selection.map(
              ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(field2.name) : is(field2, SQL.Aliased) ? field2.sql : field2
            ),
            sql`, `
          )})`;
          if (is(nestedQueryRelation, Many)) {
            field = sql`coalesce(json_group_array(${field}), json_array())`;
          }
          const nestedSelection = [{
            dbKey: "data",
            tsKey: "data",
            field: field.as("data"),
            isJson: true,
            relationTableTsKey: tableConfig.tsName,
            selection
          }];
          const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
          if (needsSubquery) {
            result = this.buildSelectQuery({
              table: aliasedTable(table, tableAlias),
              fields: {},
              fieldsFlat: [
                {
                  path: [],
                  field: sql.raw("*")
                }
              ],
              where,
              limit,
              offset,
              orderBy,
              setOperators: []
            });
            where = void 0;
            limit = void 0;
            offset = void 0;
            orderBy = void 0;
          } else {
            result = aliasedTable(table, tableAlias);
          }
          result = this.buildSelectQuery({
            table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
            fields: {},
            fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
              path: [],
              field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
            })),
            joins,
            where,
            limit,
            offset,
            orderBy,
            setOperators: []
          });
        } else {
          result = this.buildSelectQuery({
            table: aliasedTable(table, tableAlias),
            fields: {},
            fieldsFlat: selection.map(({ field }) => ({
              path: [],
              field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
            })),
            joins,
            where,
            limit,
            offset,
            orderBy,
            setOperators: []
          });
        }
        return {
          tableTsKey: tableConfig.tsName,
          sql: result,
          selection
        };
      }
    };
    _a77 = entityKind;
    __publicField(SQLiteDialect, _a77, "SQLiteDialect");
    SQLiteSyncDialect = class extends SQLiteDialect {
      migrate(migrations, session, config) {
        const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
        const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
        session.run(migrationTableCreate);
        const dbMigrations = session.values(
          sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
        );
        const lastDbMigration = dbMigrations[0] ?? void 0;
        session.run(sql`BEGIN`);
        try {
          for (const migration of migrations) {
            if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
              for (const stmt of migration.sql) {
                session.run(sql.raw(stmt));
              }
              session.run(
                sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
              );
            }
          }
          session.run(sql`COMMIT`);
        } catch (e) {
          session.run(sql`ROLLBACK`);
          throw e;
        }
      }
    };
    _a78 = entityKind;
    __publicField(SQLiteSyncDialect, _a78, "SQLiteSyncDialect");
    SQLiteAsyncDialect = class extends SQLiteDialect {
      async migrate(migrations, session, config) {
        const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
        const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
        await session.run(migrationTableCreate);
        const dbMigrations = await session.values(
          sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
        );
        const lastDbMigration = dbMigrations[0] ?? void 0;
        await session.transaction(async (tx) => {
          for (const migration of migrations) {
            if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
              for (const stmt of migration.sql) {
                await tx.run(sql.raw(stmt));
              }
              await tx.run(
                sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
              );
            }
          }
        });
      }
    };
    _a79 = entityKind;
    __publicField(SQLiteAsyncDialect, _a79, "SQLiteAsyncDialect");
  }
});
var _a80;
var TypedQueryBuilder;
var init_query_builder = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/query-builders/query-builder.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    TypedQueryBuilder = class {
      /** @internal */
      getSelectedFields() {
        return this._.selectedFields;
      }
    };
    _a80 = entityKind;
    __publicField(TypedQueryBuilder, _a80, "TypedQueryBuilder");
  }
});
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var _a81;
var SQLiteSelectBuilder;
var _a82;
var SQLiteSelectQueryBuilderBase;
var _a83;
var SQLiteSelectBase;
var getSQLiteSetOperators;
var union;
var unionAll;
var intersect;
var except;
var init_select2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/query-builders/select.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_query_builder();
    init_query_promise();
    init_selection_proxy();
    init_sql();
    init_subquery();
    init_table();
    init_utils();
    init_view_common();
    init_view_base();
    SQLiteSelectBuilder = class {
      fields;
      session;
      dialect;
      withList;
      distinct;
      constructor(config) {
        this.fields = config.fields;
        this.session = config.session;
        this.dialect = config.dialect;
        this.withList = config.withList;
        this.distinct = config.distinct;
      }
      from(source) {
        const isPartialSelect = !!this.fields;
        let fields;
        if (this.fields) {
          fields = this.fields;
        } else if (is(source, Subquery)) {
          fields = Object.fromEntries(
            Object.keys(source._.selectedFields).map((key) => [key, source[key]])
          );
        } else if (is(source, SQLiteViewBase)) {
          fields = source[ViewBaseConfig].selectedFields;
        } else if (is(source, SQL)) {
          fields = {};
        } else {
          fields = getTableColumns(source);
        }
        return new SQLiteSelectBase({
          table: source,
          fields,
          isPartialSelect,
          session: this.session,
          dialect: this.dialect,
          withList: this.withList,
          distinct: this.distinct
        });
      }
    };
    _a81 = entityKind;
    __publicField(SQLiteSelectBuilder, _a81, "SQLiteSelectBuilder");
    SQLiteSelectQueryBuilderBase = class extends TypedQueryBuilder {
      _;
      /** @internal */
      config;
      joinsNotNullableMap;
      tableName;
      isPartialSelect;
      session;
      dialect;
      constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
        super();
        this.config = {
          withList,
          table,
          fields: { ...fields },
          distinct,
          setOperators: []
        };
        this.isPartialSelect = isPartialSelect;
        this.session = session;
        this.dialect = dialect;
        this._ = {
          selectedFields: fields
        };
        this.tableName = getTableLikeName(table);
        this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
      }
      createJoin(joinType) {
        return (table, on) => {
          const baseTableName = this.tableName;
          const tableName = getTableLikeName(table);
          if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
            throw new Error(`Alias "${tableName}" is already used in this query`);
          }
          if (!this.isPartialSelect) {
            if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
              this.config.fields = {
                [baseTableName]: this.config.fields
              };
            }
            if (typeof tableName === "string" && !is(table, SQL)) {
              const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
              this.config.fields[tableName] = selection;
            }
          }
          if (typeof on === "function") {
            on = on(
              new Proxy(
                this.config.fields,
                new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
              )
            );
          }
          if (!this.config.joins) {
            this.config.joins = [];
          }
          this.config.joins.push({ on, table, joinType, alias: tableName });
          if (typeof tableName === "string") {
            switch (joinType) {
              case "left": {
                this.joinsNotNullableMap[tableName] = false;
                break;
              }
              case "right": {
                this.joinsNotNullableMap = Object.fromEntries(
                  Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
                );
                this.joinsNotNullableMap[tableName] = true;
                break;
              }
              case "inner": {
                this.joinsNotNullableMap[tableName] = true;
                break;
              }
              case "full": {
                this.joinsNotNullableMap = Object.fromEntries(
                  Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
                );
                this.joinsNotNullableMap[tableName] = false;
                break;
              }
            }
          }
          return this;
        };
      }
      /**
       * Executes a `left join` operation by adding another table to the current query.
       *
       * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
       *
       * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
       *
       * @param table the table to join.
       * @param on the `on` clause.
       *
       * @example
       *
       * ```ts
       * // Select all users and their pets
       * const usersWithPets: { user: User; pets: Pet | null }[] = await db.select()
       *   .from(users)
       *   .leftJoin(pets, eq(users.id, pets.ownerId))
       *
       * // Select userId and petId
       * const usersIdsAndPetIds: { userId: number; petId: number | null }[] = await db.select({
       *   userId: users.id,
       *   petId: pets.id,
       * })
       *   .from(users)
       *   .leftJoin(pets, eq(users.id, pets.ownerId))
       * ```
       */
      leftJoin = this.createJoin("left");
      /**
       * Executes a `right join` operation by adding another table to the current query.
       *
       * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
       *
       * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
       *
       * @param table the table to join.
       * @param on the `on` clause.
       *
       * @example
       *
       * ```ts
       * // Select all users and their pets
       * const usersWithPets: { user: User | null; pets: Pet }[] = await db.select()
       *   .from(users)
       *   .rightJoin(pets, eq(users.id, pets.ownerId))
       *
       * // Select userId and petId
       * const usersIdsAndPetIds: { userId: number | null; petId: number }[] = await db.select({
       *   userId: users.id,
       *   petId: pets.id,
       * })
       *   .from(users)
       *   .rightJoin(pets, eq(users.id, pets.ownerId))
       * ```
       */
      rightJoin = this.createJoin("right");
      /**
       * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
       *
       * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
       *
       * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
       *
       * @param table the table to join.
       * @param on the `on` clause.
       *
       * @example
       *
       * ```ts
       * // Select all users and their pets
       * const usersWithPets: { user: User; pets: Pet }[] = await db.select()
       *   .from(users)
       *   .innerJoin(pets, eq(users.id, pets.ownerId))
       *
       * // Select userId and petId
       * const usersIdsAndPetIds: { userId: number; petId: number }[] = await db.select({
       *   userId: users.id,
       *   petId: pets.id,
       * })
       *   .from(users)
       *   .innerJoin(pets, eq(users.id, pets.ownerId))
       * ```
       */
      innerJoin = this.createJoin("inner");
      /**
       * Executes a `full join` operation by combining rows from two tables into a new table.
       *
       * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
       *
       * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
       *
       * @param table the table to join.
       * @param on the `on` clause.
       *
       * @example
       *
       * ```ts
       * // Select all users and their pets
       * const usersWithPets: { user: User | null; pets: Pet | null }[] = await db.select()
       *   .from(users)
       *   .fullJoin(pets, eq(users.id, pets.ownerId))
       *
       * // Select userId and petId
       * const usersIdsAndPetIds: { userId: number | null; petId: number | null }[] = await db.select({
       *   userId: users.id,
       *   petId: pets.id,
       * })
       *   .from(users)
       *   .fullJoin(pets, eq(users.id, pets.ownerId))
       * ```
       */
      fullJoin = this.createJoin("full");
      createSetOperator(type, isAll) {
        return (rightSelection) => {
          const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
          if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
            throw new Error(
              "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
            );
          }
          this.config.setOperators.push({ type, isAll, rightSelect });
          return this;
        };
      }
      /**
       * Adds `union` set operator to the query.
       *
       * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
       *
       * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
       *
       * @example
       *
       * ```ts
       * // Select all unique names from customers and users tables
       * await db.select({ name: users.name })
       *   .from(users)
       *   .union(
       *     db.select({ name: customers.name }).from(customers)
       *   );
       * // or
       * import { union } from 'drizzle-orm/sqlite-core'
       *
       * await union(
       *   db.select({ name: users.name }).from(users),
       *   db.select({ name: customers.name }).from(customers)
       * );
       * ```
       */
      union = this.createSetOperator("union", false);
      /**
       * Adds `union all` set operator to the query.
       *
       * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
       *
       * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
       *
       * @example
       *
       * ```ts
       * // Select all transaction ids from both online and in-store sales
       * await db.select({ transaction: onlineSales.transactionId })
       *   .from(onlineSales)
       *   .unionAll(
       *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
       *   );
       * // or
       * import { unionAll } from 'drizzle-orm/sqlite-core'
       *
       * await unionAll(
       *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
       *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
       * );
       * ```
       */
      unionAll = this.createSetOperator("union", true);
      /**
       * Adds `intersect` set operator to the query.
       *
       * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
       *
       * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
       *
       * @example
       *
       * ```ts
       * // Select course names that are offered in both departments A and B
       * await db.select({ courseName: depA.courseName })
       *   .from(depA)
       *   .intersect(
       *     db.select({ courseName: depB.courseName }).from(depB)
       *   );
       * // or
       * import { intersect } from 'drizzle-orm/sqlite-core'
       *
       * await intersect(
       *   db.select({ courseName: depA.courseName }).from(depA),
       *   db.select({ courseName: depB.courseName }).from(depB)
       * );
       * ```
       */
      intersect = this.createSetOperator("intersect", false);
      /**
       * Adds `except` set operator to the query.
       *
       * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
       *
       * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
       *
       * @example
       *
       * ```ts
       * // Select all courses offered in department A but not in department B
       * await db.select({ courseName: depA.courseName })
       *   .from(depA)
       *   .except(
       *     db.select({ courseName: depB.courseName }).from(depB)
       *   );
       * // or
       * import { except } from 'drizzle-orm/sqlite-core'
       *
       * await except(
       *   db.select({ courseName: depA.courseName }).from(depA),
       *   db.select({ courseName: depB.courseName }).from(depB)
       * );
       * ```
       */
      except = this.createSetOperator("except", false);
      /** @internal */
      addSetOperators(setOperators) {
        this.config.setOperators.push(...setOperators);
        return this;
      }
      /**
       * Adds a `where` clause to the query.
       *
       * Calling this method will select only those rows that fulfill a specified condition.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
       *
       * @param where the `where` clause.
       *
       * @example
       * You can use conditional operators and `sql function` to filter the rows to be selected.
       *
       * ```ts
       * // Select all cars with green color
       * await db.select().from(cars).where(eq(cars.color, 'green'));
       * // or
       * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
       * ```
       *
       * You can logically combine conditional operators with `and()` and `or()` operators:
       *
       * ```ts
       * // Select all BMW cars with a green color
       * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
       *
       * // Select all cars with the green or blue color
       * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
       * ```
       */
      where(where) {
        if (typeof where === "function") {
          where = where(
            new Proxy(
              this.config.fields,
              new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
            )
          );
        }
        this.config.where = where;
        return this;
      }
      /**
       * Adds a `having` clause to the query.
       *
       * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
       *
       * @param having the `having` clause.
       *
       * @example
       *
       * ```ts
       * // Select all brands with more than one car
       * await db.select({
       * 	brand: cars.brand,
       * 	count: sql<number>`cast(count(${cars.id}) as int)`,
       * })
       *   .from(cars)
       *   .groupBy(cars.brand)
       *   .having(({ count }) => gt(count, 1));
       * ```
       */
      having(having) {
        if (typeof having === "function") {
          having = having(
            new Proxy(
              this.config.fields,
              new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
            )
          );
        }
        this.config.having = having;
        return this;
      }
      groupBy(...columns) {
        if (typeof columns[0] === "function") {
          const groupBy = columns[0](
            new Proxy(
              this.config.fields,
              new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
            )
          );
          this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
        } else {
          this.config.groupBy = columns;
        }
        return this;
      }
      orderBy(...columns) {
        if (typeof columns[0] === "function") {
          const orderBy = columns[0](
            new Proxy(
              this.config.fields,
              new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
            )
          );
          const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
          if (this.config.setOperators.length > 0) {
            this.config.setOperators.at(-1).orderBy = orderByArray;
          } else {
            this.config.orderBy = orderByArray;
          }
        } else {
          const orderByArray = columns;
          if (this.config.setOperators.length > 0) {
            this.config.setOperators.at(-1).orderBy = orderByArray;
          } else {
            this.config.orderBy = orderByArray;
          }
        }
        return this;
      }
      /**
       * Adds a `limit` clause to the query.
       *
       * Calling this method will set the maximum number of rows that will be returned by this query.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
       *
       * @param limit the `limit` clause.
       *
       * @example
       *
       * ```ts
       * // Get the first 10 people from this query.
       * await db.select().from(people).limit(10);
       * ```
       */
      limit(limit) {
        if (this.config.setOperators.length > 0) {
          this.config.setOperators.at(-1).limit = limit;
        } else {
          this.config.limit = limit;
        }
        return this;
      }
      /**
       * Adds an `offset` clause to the query.
       *
       * Calling this method will skip a number of rows when returning results from this query.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
       *
       * @param offset the `offset` clause.
       *
       * @example
       *
       * ```ts
       * // Get the 10th-20th people from this query.
       * await db.select().from(people).offset(10).limit(10);
       * ```
       */
      offset(offset) {
        if (this.config.setOperators.length > 0) {
          this.config.setOperators.at(-1).offset = offset;
        } else {
          this.config.offset = offset;
        }
        return this;
      }
      /** @internal */
      getSQL() {
        return this.dialect.buildSelectQuery(this.config);
      }
      toSQL() {
        const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
        return rest;
      }
      as(alias) {
        return new Proxy(
          new Subquery(this.getSQL(), this.config.fields, alias),
          new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
      /** @internal */
      getSelectedFields() {
        return new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
      $dynamic() {
        return this;
      }
    };
    _a82 = entityKind;
    __publicField(SQLiteSelectQueryBuilderBase, _a82, "SQLiteSelectQueryBuilder");
    SQLiteSelectBase = class extends SQLiteSelectQueryBuilderBase {
      /** @internal */
      _prepare(isOneTimeQuery = true) {
        if (!this.session) {
          throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
        }
        const fieldsList = orderSelectedFields(this.config.fields);
        const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          this.dialect.sqlToQuery(this.getSQL()),
          fieldsList,
          "all",
          true
        );
        query.joinsNotNullableMap = this.joinsNotNullableMap;
        return query;
      }
      prepare() {
        return this._prepare(false);
      }
      run = (placeholderValues) => {
        return this._prepare().run(placeholderValues);
      };
      all = (placeholderValues) => {
        return this._prepare().all(placeholderValues);
      };
      get = (placeholderValues) => {
        return this._prepare().get(placeholderValues);
      };
      values = (placeholderValues) => {
        return this._prepare().values(placeholderValues);
      };
      async execute() {
        return this.all();
      }
    };
    _a83 = entityKind;
    __publicField(SQLiteSelectBase, _a83, "SQLiteSelect");
    applyMixins(SQLiteSelectBase, [QueryPromise]);
    getSQLiteSetOperators = () => ({
      union,
      unionAll,
      intersect,
      except
    });
    union = createSetOperator("union", false);
    unionAll = createSetOperator("union", true);
    intersect = createSetOperator("intersect", false);
    except = createSetOperator("except", false);
  }
});
var _a84;
var QueryBuilder;
var init_query_builder2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_selection_proxy();
    init_dialect();
    init_subquery();
    init_select2();
    QueryBuilder = class {
      dialect;
      $with(alias) {
        const queryBuilder = this;
        return {
          as(qb) {
            if (typeof qb === "function") {
              qb = qb(queryBuilder);
            }
            return new Proxy(
              new WithSubquery(qb.getSQL(), qb.getSelectedFields(), alias, true),
              new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
            );
          }
        };
      }
      with(...queries) {
        const self2 = this;
        function select(fields) {
          return new SQLiteSelectBuilder({
            fields: fields ?? void 0,
            session: void 0,
            dialect: self2.getDialect(),
            withList: queries
          });
        }
        function selectDistinct(fields) {
          return new SQLiteSelectBuilder({
            fields: fields ?? void 0,
            session: void 0,
            dialect: self2.getDialect(),
            withList: queries,
            distinct: true
          });
        }
        return { select, selectDistinct };
      }
      select(fields) {
        return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
      }
      selectDistinct(fields) {
        return new SQLiteSelectBuilder({
          fields: fields ?? void 0,
          session: void 0,
          dialect: this.getDialect(),
          distinct: true
        });
      }
      // Lazy load dialect to avoid circular dependency
      getDialect() {
        if (!this.dialect) {
          this.dialect = new SQLiteSyncDialect();
        }
        return this.dialect;
      }
    };
    _a84 = entityKind;
    __publicField(QueryBuilder, _a84, "SQLiteQueryBuilder");
  }
});
var init_select_types = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/query-builders/select.types.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
var _a85;
var SQLiteUpdateBuilder;
var _a86;
var SQLiteUpdateBase;
var init_update = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/query-builders/update.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_query_promise();
    init_table3();
    init_utils();
    SQLiteUpdateBuilder = class {
      constructor(table, session, dialect, withList) {
        this.table = table;
        this.session = session;
        this.dialect = dialect;
        this.withList = withList;
      }
      set(values) {
        return new SQLiteUpdateBase(
          this.table,
          mapUpdateSet(this.table, values),
          this.session,
          this.dialect,
          this.withList
        );
      }
    };
    _a85 = entityKind;
    __publicField(SQLiteUpdateBuilder, _a85, "SQLiteUpdateBuilder");
    SQLiteUpdateBase = class extends QueryPromise {
      constructor(table, set, session, dialect, withList) {
        super();
        this.session = session;
        this.dialect = dialect;
        this.config = { set, table, withList };
      }
      /** @internal */
      config;
      /**
       * Adds a 'where' clause to the query.
       *
       * Calling this method will update only those rows that fulfill a specified condition.
       *
       * See docs: {@link https://orm.drizzle.team/docs/update}
       *
       * @param where the 'where' clause.
       *
       * @example
       * You can use conditional operators and `sql function` to filter the rows to be updated.
       *
       * ```ts
       * // Update all cars with green color
       * db.update(cars).set({ color: 'red' })
       *   .where(eq(cars.color, 'green'));
       * // or
       * db.update(cars).set({ color: 'red' })
       *   .where(sql`${cars.color} = 'green'`)
       * ```
       *
       * You can logically combine conditional operators with `and()` and `or()` operators:
       *
       * ```ts
       * // Update all BMW cars with a green color
       * db.update(cars).set({ color: 'red' })
       *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
       *
       * // Update all cars with the green or blue color
       * db.update(cars).set({ color: 'red' })
       *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
       * ```
       */
      where(where) {
        this.config.where = where;
        return this;
      }
      returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
        this.config.returning = orderSelectedFields(fields);
        return this;
      }
      /** @internal */
      getSQL() {
        return this.dialect.buildUpdateQuery(this.config);
      }
      toSQL() {
        const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
        return rest;
      }
      /** @internal */
      _prepare(isOneTimeQuery = true) {
        return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          this.dialect.sqlToQuery(this.getSQL()),
          this.config.returning,
          this.config.returning ? "all" : "run",
          true
        );
      }
      prepare() {
        return this._prepare(false);
      }
      run = (placeholderValues) => {
        return this._prepare().run(placeholderValues);
      };
      all = (placeholderValues) => {
        return this._prepare().all(placeholderValues);
      };
      get = (placeholderValues) => {
        return this._prepare().get(placeholderValues);
      };
      values = (placeholderValues) => {
        return this._prepare().values(placeholderValues);
      };
      async execute() {
        return this.config.returning ? this.all() : this.run();
      }
      $dynamic() {
        return this;
      }
    };
    _a86 = entityKind;
    __publicField(SQLiteUpdateBase, _a86, "SQLiteUpdate");
  }
});
var init_query_builders = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/query-builders/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_delete();
    init_insert();
    init_query_builder2();
    init_select2();
    init_select_types();
    init_update();
  }
});
var _a87;
var RelationalQueryBuilder;
var _a88;
var SQLiteRelationalQuery;
var _a89;
var SQLiteSyncRelationalQuery;
var init_query = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/query-builders/query.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_query_promise();
    init_relations();
    RelationalQueryBuilder = class {
      constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
        this.mode = mode;
        this.fullSchema = fullSchema;
        this.schema = schema;
        this.tableNamesMap = tableNamesMap;
        this.table = table;
        this.tableConfig = tableConfig;
        this.dialect = dialect;
        this.session = session;
      }
      findMany(config) {
        return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
          this.fullSchema,
          this.schema,
          this.tableNamesMap,
          this.table,
          this.tableConfig,
          this.dialect,
          this.session,
          config ? config : {},
          "many"
        ) : new SQLiteRelationalQuery(
          this.fullSchema,
          this.schema,
          this.tableNamesMap,
          this.table,
          this.tableConfig,
          this.dialect,
          this.session,
          config ? config : {},
          "many"
        );
      }
      findFirst(config) {
        return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
          this.fullSchema,
          this.schema,
          this.tableNamesMap,
          this.table,
          this.tableConfig,
          this.dialect,
          this.session,
          config ? { ...config, limit: 1 } : { limit: 1 },
          "first"
        ) : new SQLiteRelationalQuery(
          this.fullSchema,
          this.schema,
          this.tableNamesMap,
          this.table,
          this.tableConfig,
          this.dialect,
          this.session,
          config ? { ...config, limit: 1 } : { limit: 1 },
          "first"
        );
      }
    };
    _a87 = entityKind;
    __publicField(RelationalQueryBuilder, _a87, "SQLiteAsyncRelationalQueryBuilder");
    SQLiteRelationalQuery = class extends QueryPromise {
      constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
        super();
        this.fullSchema = fullSchema;
        this.schema = schema;
        this.tableNamesMap = tableNamesMap;
        this.table = table;
        this.tableConfig = tableConfig;
        this.dialect = dialect;
        this.session = session;
        this.config = config;
        this.mode = mode;
      }
      /** @internal */
      mode;
      /** @internal */
      getSQL() {
        return this.dialect.buildRelationalQuery({
          fullSchema: this.fullSchema,
          schema: this.schema,
          tableNamesMap: this.tableNamesMap,
          table: this.table,
          tableConfig: this.tableConfig,
          queryConfig: this.config,
          tableAlias: this.tableConfig.tsName
        }).sql;
      }
      /** @internal */
      _prepare(isOneTimeQuery = false) {
        const { query, builtQuery } = this._toSQL();
        return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          builtQuery,
          void 0,
          this.mode === "first" ? "get" : "all",
          true,
          (rawRows, mapColumnValue) => {
            const rows = rawRows.map(
              (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
            );
            if (this.mode === "first") {
              return rows[0];
            }
            return rows;
          }
        );
      }
      prepare() {
        return this._prepare(false);
      }
      _toSQL() {
        const query = this.dialect.buildRelationalQuery({
          fullSchema: this.fullSchema,
          schema: this.schema,
          tableNamesMap: this.tableNamesMap,
          table: this.table,
          tableConfig: this.tableConfig,
          queryConfig: this.config,
          tableAlias: this.tableConfig.tsName
        });
        const builtQuery = this.dialect.sqlToQuery(query.sql);
        return { query, builtQuery };
      }
      toSQL() {
        return this._toSQL().builtQuery;
      }
      /** @internal */
      executeRaw() {
        if (this.mode === "first") {
          return this._prepare(false).get();
        }
        return this._prepare(false).all();
      }
      async execute() {
        return this.executeRaw();
      }
    };
    _a88 = entityKind;
    __publicField(SQLiteRelationalQuery, _a88, "SQLiteAsyncRelationalQuery");
    SQLiteSyncRelationalQuery = class extends SQLiteRelationalQuery {
      sync() {
        return this.executeRaw();
      }
    };
    _a89 = entityKind;
    __publicField(SQLiteSyncRelationalQuery, _a89, "SQLiteSyncRelationalQuery");
  }
});
var _a90;
var SQLiteRaw;
var init_raw = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/query-builders/raw.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_query_promise();
    SQLiteRaw = class extends QueryPromise {
      constructor(execute, getSQL, action, dialect, mapBatchResult) {
        super();
        this.execute = execute;
        this.getSQL = getSQL;
        this.dialect = dialect;
        this.mapBatchResult = mapBatchResult;
        this.config = { action };
      }
      /** @internal */
      config;
      getQuery() {
        return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
      }
      mapResult(result, isFromBatch) {
        return isFromBatch ? this.mapBatchResult(result) : result;
      }
      _prepare() {
        return this;
      }
      /** @internal */
      isResponseInArrayMode() {
        return false;
      }
    };
    _a90 = entityKind;
    __publicField(SQLiteRaw, _a90, "SQLiteRaw");
  }
});
var _a91;
var BaseSQLiteDatabase;
var init_db = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/db.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_selection_proxy();
    init_query_builders();
    init_subquery();
    init_query();
    init_raw();
    BaseSQLiteDatabase = class {
      constructor(resultKind, dialect, session, schema) {
        this.resultKind = resultKind;
        this.dialect = dialect;
        this.session = session;
        this._ = schema ? {
          schema: schema.schema,
          fullSchema: schema.fullSchema,
          tableNamesMap: schema.tableNamesMap
        } : {
          schema: void 0,
          fullSchema: {},
          tableNamesMap: {}
        };
        this.query = {};
        const query = this.query;
        if (this._.schema) {
          for (const [tableName, columns] of Object.entries(this._.schema)) {
            query[tableName] = new RelationalQueryBuilder(
              resultKind,
              schema.fullSchema,
              this._.schema,
              this._.tableNamesMap,
              schema.fullSchema[tableName],
              columns,
              dialect,
              session
            );
          }
        }
      }
      query;
      /**
       * Creates a subquery that defines a temporary named result set as a CTE.
       *
       * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
       *
       * @param alias The alias for the subquery.
       *
       * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
       *
       * @example
       *
       * ```ts
       * // Create a subquery with alias 'sq' and use it in the select query
       * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
       *
       * const result = await db.with(sq).select().from(sq);
       * ```
       *
       * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
       *
       * ```ts
       * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
       * const sq = db.$with('sq').as(db.select({
       *   name: sql<string>`upper(${users.name})`.as('name'),
       * })
       * .from(users));
       *
       * const result = await db.with(sq).select({ name: sq.name }).from(sq);
       * ```
       */
      $with(alias) {
        return {
          as(qb) {
            if (typeof qb === "function") {
              qb = qb(new QueryBuilder());
            }
            return new Proxy(
              new WithSubquery(qb.getSQL(), qb.getSelectedFields(), alias, true),
              new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
            );
          }
        };
      }
      /**
       * Incorporates a previously defined CTE (using `$with`) into the main query.
       *
       * This method allows the main query to reference a temporary named result set.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
       *
       * @param queries The CTEs to incorporate into the main query.
       *
       * @example
       *
       * ```ts
       * // Define a subquery 'sq' as a CTE using $with
       * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
       *
       * // Incorporate the CTE 'sq' into the main query and select from it
       * const result = await db.with(sq).select().from(sq);
       * ```
       */
      with(...queries) {
        const self2 = this;
        function select(fields) {
          return new SQLiteSelectBuilder({
            fields: fields ?? void 0,
            session: self2.session,
            dialect: self2.dialect,
            withList: queries
          });
        }
        function selectDistinct(fields) {
          return new SQLiteSelectBuilder({
            fields: fields ?? void 0,
            session: self2.session,
            dialect: self2.dialect,
            withList: queries,
            distinct: true
          });
        }
        function update(table) {
          return new SQLiteUpdateBuilder(table, self2.session, self2.dialect, queries);
        }
        function insert(into) {
          return new SQLiteInsertBuilder(into, self2.session, self2.dialect, queries);
        }
        function delete_(from) {
          return new SQLiteDeleteBase(from, self2.session, self2.dialect, queries);
        }
        return { select, selectDistinct, update, insert, delete: delete_ };
      }
      select(fields) {
        return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
      }
      selectDistinct(fields) {
        return new SQLiteSelectBuilder({
          fields: fields ?? void 0,
          session: this.session,
          dialect: this.dialect,
          distinct: true
        });
      }
      /**
       * Creates an update query.
       *
       * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
       *
       * Use `.set()` method to specify which values to update.
       *
       * See docs: {@link https://orm.drizzle.team/docs/update}
       *
       * @param table The table to update.
       *
       * @example
       *
       * ```ts
       * // Update all rows in the 'cars' table
       * await db.update(cars).set({ color: 'red' });
       *
       * // Update rows with filters and conditions
       * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
       *
       * // Update with returning clause
       * const updatedCar: Car[] = await db.update(cars)
       *   .set({ color: 'red' })
       *   .where(eq(cars.id, 1))
       *   .returning();
       * ```
       */
      update(table) {
        return new SQLiteUpdateBuilder(table, this.session, this.dialect);
      }
      /**
       * Creates an insert query.
       *
       * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
       *
       * See docs: {@link https://orm.drizzle.team/docs/insert}
       *
       * @param table The table to insert into.
       *
       * @example
       *
       * ```ts
       * // Insert one row
       * await db.insert(cars).values({ brand: 'BMW' });
       *
       * // Insert multiple rows
       * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
       *
       * // Insert with returning clause
       * const insertedCar: Car[] = await db.insert(cars)
       *   .values({ brand: 'BMW' })
       *   .returning();
       * ```
       */
      insert(into) {
        return new SQLiteInsertBuilder(into, this.session, this.dialect);
      }
      /**
       * Creates a delete query.
       *
       * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
       *
       * See docs: {@link https://orm.drizzle.team/docs/delete}
       *
       * @param table The table to delete from.
       *
       * @example
       *
       * ```ts
       * // Delete all rows in the 'cars' table
       * await db.delete(cars);
       *
       * // Delete rows with filters and conditions
       * await db.delete(cars).where(eq(cars.color, 'green'));
       *
       * // Delete with returning clause
       * const deletedCar: Car[] = await db.delete(cars)
       *   .where(eq(cars.id, 1))
       *   .returning();
       * ```
       */
      delete(from) {
        return new SQLiteDeleteBase(from, this.session, this.dialect);
      }
      run(query) {
        const sql2 = query.getSQL();
        if (this.resultKind === "async") {
          return new SQLiteRaw(
            async () => this.session.run(sql2),
            () => sql2,
            "run",
            this.dialect,
            this.session.extractRawRunValueFromBatchResult.bind(this.session)
          );
        }
        return this.session.run(sql2);
      }
      all(query) {
        const sql2 = query.getSQL();
        if (this.resultKind === "async") {
          return new SQLiteRaw(
            async () => this.session.all(sql2),
            () => sql2,
            "all",
            this.dialect,
            this.session.extractRawAllValueFromBatchResult.bind(this.session)
          );
        }
        return this.session.all(sql2);
      }
      get(query) {
        const sql2 = query.getSQL();
        if (this.resultKind === "async") {
          return new SQLiteRaw(
            async () => this.session.get(sql2),
            () => sql2,
            "get",
            this.dialect,
            this.session.extractRawGetValueFromBatchResult.bind(this.session)
          );
        }
        return this.session.get(sql2);
      }
      values(query) {
        const sql2 = query.getSQL();
        if (this.resultKind === "async") {
          return new SQLiteRaw(
            async () => this.session.values(sql2),
            () => sql2,
            "values",
            this.dialect,
            this.session.extractRawValuesValueFromBatchResult.bind(this.session)
          );
        }
        return this.session.values(sql2);
      }
      transaction(transaction, config) {
        return this.session.transaction(transaction, config);
      }
    };
    _a91 = entityKind;
    __publicField(BaseSQLiteDatabase, _a91, "BaseSQLiteDatabase");
  }
});
var init_alias2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/alias.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
var _a92;
var CheckBuilder;
var _a93;
var Check;
var init_checks = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/checks.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    CheckBuilder = class {
      constructor(name, value) {
        this.name = name;
        this.value = value;
      }
      brand;
      build(table) {
        return new Check(table, this);
      }
    };
    _a92 = entityKind;
    __publicField(CheckBuilder, _a92, "SQLiteCheckBuilder");
    Check = class {
      constructor(table, builder) {
        this.table = table;
        this.name = builder.name;
        this.value = builder.value;
      }
      name;
      value;
    };
    _a93 = entityKind;
    __publicField(Check, _a93, "SQLiteCheck");
  }
});
var _a94;
var IndexBuilderOn;
var _a95;
var IndexBuilder;
var _a96;
var Index;
var init_indexes = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/indexes.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    IndexBuilderOn = class {
      constructor(name, unique) {
        this.name = name;
        this.unique = unique;
      }
      on(...columns) {
        return new IndexBuilder(this.name, columns, this.unique);
      }
    };
    _a94 = entityKind;
    __publicField(IndexBuilderOn, _a94, "SQLiteIndexBuilderOn");
    IndexBuilder = class {
      /** @internal */
      config;
      constructor(name, columns, unique) {
        this.config = {
          name,
          columns,
          unique,
          where: void 0
        };
      }
      /**
       * Condition for partial index.
       */
      where(condition) {
        this.config.where = condition;
        return this;
      }
      /** @internal */
      build(table) {
        return new Index(this.config, table);
      }
    };
    _a95 = entityKind;
    __publicField(IndexBuilder, _a95, "SQLiteIndexBuilder");
    Index = class {
      config;
      constructor(config, table) {
        this.config = { ...config, table };
      }
    };
    _a96 = entityKind;
    __publicField(Index, _a96, "SQLiteIndex");
  }
});
function primaryKey(...config) {
  if (config[0].columns) {
    return new PrimaryKeyBuilder2(config[0].columns, config[0].name);
  }
  return new PrimaryKeyBuilder2(config);
}
var _a97;
var PrimaryKeyBuilder2;
var _a98;
var PrimaryKey2;
var init_primary_keys2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/primary-keys.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_table3();
    PrimaryKeyBuilder2 = class {
      /** @internal */
      columns;
      /** @internal */
      name;
      constructor(columns, name) {
        this.columns = columns;
        this.name = name;
      }
      /** @internal */
      build(table) {
        return new PrimaryKey2(table, this.columns, this.name);
      }
    };
    _a97 = entityKind;
    __publicField(PrimaryKeyBuilder2, _a97, "SQLitePrimaryKeyBuilder");
    PrimaryKey2 = class {
      constructor(table, columns, name) {
        this.table = table;
        this.columns = columns;
        this.name = name;
      }
      columns;
      name;
      getName() {
        return this.name ?? `${this.table[SQLiteTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
      }
    };
    _a98 = entityKind;
    __publicField(PrimaryKey2, _a98, "SQLitePrimaryKey");
  }
});
var init_expressions2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/expressions.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_expressions();
  }
});
var init_operations = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/operations.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
var init_drizzle_orm = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_alias();
    init_column_builder();
    init_column();
    init_entity();
    init_errors();
    init_expressions2();
    init_logger();
    init_operations();
    init_query_promise();
    init_relations();
    init_sql2();
    init_subquery();
    init_table();
    init_utils();
    init_view_common();
  }
});
var _a99;
var ExecuteResultSync;
var _a100;
var SQLitePreparedQuery;
var _a101;
var SQLiteSession;
var _a102;
var SQLiteTransaction;
var init_session = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/session.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_errors();
    init_drizzle_orm();
    init_db();
    ExecuteResultSync = class extends QueryPromise {
      constructor(resultCb) {
        super();
        this.resultCb = resultCb;
      }
      async execute() {
        return this.resultCb();
      }
      sync() {
        return this.resultCb();
      }
    };
    _a99 = entityKind;
    __publicField(ExecuteResultSync, _a99, "ExecuteResultSync");
    SQLitePreparedQuery = class {
      constructor(mode, executeMethod, query) {
        this.mode = mode;
        this.executeMethod = executeMethod;
        this.query = query;
      }
      /** @internal */
      joinsNotNullableMap;
      getQuery() {
        return this.query;
      }
      mapRunResult(result, _isFromBatch) {
        return result;
      }
      mapAllResult(_result, _isFromBatch) {
        throw new Error("Not implemented");
      }
      mapGetResult(_result, _isFromBatch) {
        throw new Error("Not implemented");
      }
      execute(placeholderValues) {
        if (this.mode === "async") {
          return this[this.executeMethod](placeholderValues);
        }
        return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
      }
      mapResult(response, isFromBatch) {
        switch (this.executeMethod) {
          case "run": {
            return this.mapRunResult(response, isFromBatch);
          }
          case "all": {
            return this.mapAllResult(response, isFromBatch);
          }
          case "get": {
            return this.mapGetResult(response, isFromBatch);
          }
        }
      }
    };
    _a100 = entityKind;
    __publicField(SQLitePreparedQuery, _a100, "PreparedQuery");
    SQLiteSession = class {
      constructor(dialect) {
        this.dialect = dialect;
      }
      prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode) {
        return this.prepareQuery(query, fields, executeMethod, isResponseInArrayMode);
      }
      run(query) {
        const staticQuery = this.dialect.sqlToQuery(query);
        try {
          return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
        } catch (err) {
          throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
        }
      }
      /** @internal */
      extractRawRunValueFromBatchResult(result) {
        return result;
      }
      all(query) {
        return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
      }
      /** @internal */
      extractRawAllValueFromBatchResult(_result) {
        throw new Error("Not implemented");
      }
      get(query) {
        return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
      }
      /** @internal */
      extractRawGetValueFromBatchResult(_result) {
        throw new Error("Not implemented");
      }
      values(query) {
        return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
      }
      /** @internal */
      extractRawValuesValueFromBatchResult(_result) {
        throw new Error("Not implemented");
      }
    };
    _a101 = entityKind;
    __publicField(SQLiteSession, _a101, "SQLiteSession");
    SQLiteTransaction = class extends BaseSQLiteDatabase {
      constructor(resultType, dialect, session, schema, nestedIndex = 0) {
        super(resultType, dialect, session, schema);
        this.schema = schema;
        this.nestedIndex = nestedIndex;
      }
      rollback() {
        throw new TransactionRollbackError();
      }
    };
    _a102 = entityKind;
    __publicField(SQLiteTransaction, _a102, "SQLiteTransaction");
  }
});
var init_subquery2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/subquery.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
var SQLiteViewConfig;
var init_view_common2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/view-common.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    SQLiteViewConfig = Symbol.for("drizzle:SQLiteViewConfig");
  }
});
var init_utils2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/utils.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
var _a103;
var ViewBuilderCore;
var _a104;
var ViewBuilder;
var _a105;
var ManualViewBuilder;
var _a106;
var SQLiteView;
var init_view = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/view.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_selection_proxy();
    init_utils();
    init_query_builder2();
    init_table3();
    init_view_base();
    init_view_common2();
    ViewBuilderCore = class {
      constructor(name) {
        this.name = name;
      }
      config = {};
    };
    _a103 = entityKind;
    __publicField(ViewBuilderCore, _a103, "SQLiteViewBuilderCore");
    ViewBuilder = class extends ViewBuilderCore {
      as(qb) {
        if (typeof qb === "function") {
          qb = qb(new QueryBuilder());
        }
        const selectionProxy = new SelectionProxyHandler({
          alias: this.name,
          sqlBehavior: "error",
          sqlAliasedBehavior: "alias",
          replaceOriginalName: true
        });
        const aliasedSelectedFields = qb.getSelectedFields();
        return new Proxy(
          new SQLiteView({
            sqliteConfig: this.config,
            config: {
              name: this.name,
              schema: void 0,
              selectedFields: aliasedSelectedFields,
              query: qb.getSQL().inlineParams()
            }
          }),
          selectionProxy
        );
      }
    };
    _a104 = entityKind;
    __publicField(ViewBuilder, _a104, "SQLiteViewBuilder");
    ManualViewBuilder = class extends ViewBuilderCore {
      columns;
      constructor(name, columns) {
        super(name);
        this.columns = getTableColumns(sqliteTable(name, columns));
      }
      existing() {
        return new Proxy(
          new SQLiteView({
            sqliteConfig: void 0,
            config: {
              name: this.name,
              schema: void 0,
              selectedFields: this.columns,
              query: void 0
            }
          }),
          new SelectionProxyHandler({
            alias: this.name,
            sqlBehavior: "error",
            sqlAliasedBehavior: "alias",
            replaceOriginalName: true
          })
        );
      }
      as(query) {
        return new Proxy(
          new SQLiteView({
            sqliteConfig: this.config,
            config: {
              name: this.name,
              schema: void 0,
              selectedFields: this.columns,
              query: query.inlineParams()
            }
          }),
          new SelectionProxyHandler({
            alias: this.name,
            sqlBehavior: "error",
            sqlAliasedBehavior: "alias",
            replaceOriginalName: true
          })
        );
      }
    };
    _a105 = entityKind;
    __publicField(ManualViewBuilder, _a105, "SQLiteManualViewBuilder");
    SQLiteView = class extends SQLiteViewBase {
      /** @internal */
      [(_a106 = entityKind, SQLiteViewConfig)];
      constructor({ sqliteConfig, config }) {
        super(config);
        this[SQLiteViewConfig] = sqliteConfig;
      }
    };
    __publicField(SQLiteView, _a106, "SQLiteView");
  }
});
var init_sqlite_core = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/sqlite-core/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_alias2();
    init_checks();
    init_columns();
    init_db();
    init_dialect();
    init_foreign_keys2();
    init_indexes();
    init_primary_keys2();
    init_query_builders();
    init_session();
    init_subquery2();
    init_table3();
    init_unique_constraint2();
    init_utils2();
    init_view();
  }
});
function d1ToRawMapping(results) {
  const rows = [];
  for (const row of results) {
    const entry = Object.keys(row).map((k) => row[k]);
    rows.push(entry);
  }
  return rows;
}
var _a107;
var SQLiteD1Session;
var _a108;
var _D1Transaction;
var D1Transaction;
var _a109;
var D1PreparedQuery;
var init_session2 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/d1/session.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_logger();
    init_sql();
    init_sqlite_core();
    init_session();
    init_utils();
    SQLiteD1Session = class extends SQLiteSession {
      constructor(client, dialect, schema, options = {}) {
        super(dialect);
        this.client = client;
        this.schema = schema;
        this.options = options;
        this.logger = options.logger ?? new NoopLogger();
      }
      logger;
      prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper) {
        const stmt = this.client.prepare(query.sql);
        return new D1PreparedQuery(
          stmt,
          query,
          this.logger,
          fields,
          executeMethod,
          isResponseInArrayMode,
          customResultMapper
        );
      }
      async batch(queries) {
        const preparedQueries = [];
        const builtQueries = [];
        for (const query of queries) {
          const preparedQuery = query._prepare();
          const builtQuery = preparedQuery.getQuery();
          preparedQueries.push(preparedQuery);
          if (builtQuery.params.length > 0) {
            builtQueries.push(preparedQuery.stmt.bind(...builtQuery.params));
          } else {
            const builtQuery2 = preparedQuery.getQuery();
            builtQueries.push(
              this.client.prepare(builtQuery2.sql).bind(...builtQuery2.params)
            );
          }
        }
        const batchResults = await this.client.batch(builtQueries);
        return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
      }
      extractRawAllValueFromBatchResult(result) {
        return result.results;
      }
      extractRawGetValueFromBatchResult(result) {
        return result.results[0];
      }
      extractRawValuesValueFromBatchResult(result) {
        return d1ToRawMapping(result.results);
      }
      async transaction(transaction, config) {
        const tx = new D1Transaction("async", this.dialect, this, this.schema);
        await this.run(sql.raw(`begin${config?.behavior ? " " + config.behavior : ""}`));
        try {
          const result = await transaction(tx);
          await this.run(sql`commit`);
          return result;
        } catch (err) {
          await this.run(sql`rollback`);
          throw err;
        }
      }
    };
    _a107 = entityKind;
    __publicField(SQLiteD1Session, _a107, "SQLiteD1Session");
    _D1Transaction = class extends SQLiteTransaction {
      async transaction(transaction) {
        const savepointName = `sp${this.nestedIndex}`;
        const tx = new _D1Transaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
        await this.session.run(sql.raw(`savepoint ${savepointName}`));
        try {
          const result = await transaction(tx);
          await this.session.run(sql.raw(`release savepoint ${savepointName}`));
          return result;
        } catch (err) {
          await this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
          throw err;
        }
      }
    };
    D1Transaction = _D1Transaction;
    _a108 = entityKind;
    __publicField(D1Transaction, _a108, "D1Transaction");
    D1PreparedQuery = class extends SQLitePreparedQuery {
      constructor(stmt, query, logger, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
        super("async", executeMethod, query);
        this.logger = logger;
        this._isResponseInArrayMode = _isResponseInArrayMode;
        this.customResultMapper = customResultMapper;
        this.fields = fields;
        this.stmt = stmt;
      }
      /** @internal */
      customResultMapper;
      /** @internal */
      fields;
      /** @internal */
      stmt;
      run(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
        this.logger.logQuery(this.query.sql, params);
        return this.stmt.bind(...params).run();
      }
      async all(placeholderValues) {
        const { fields, query, logger, stmt, customResultMapper } = this;
        if (!fields && !customResultMapper) {
          const params = fillPlaceholders(query.params, placeholderValues ?? {});
          logger.logQuery(query.sql, params);
          return stmt.bind(...params).all().then(({ results }) => this.mapAllResult(results));
        }
        const rows = await this.values(placeholderValues);
        return this.mapAllResult(rows);
      }
      mapAllResult(rows, isFromBatch) {
        if (isFromBatch) {
          rows = d1ToRawMapping(rows.results);
        }
        if (!this.fields && !this.customResultMapper) {
          return rows;
        }
        if (this.customResultMapper) {
          return this.customResultMapper(rows);
        }
        return rows.map((row) => mapResultRow(this.fields, row, this.joinsNotNullableMap));
      }
      async get(placeholderValues) {
        const { fields, joinsNotNullableMap, query, logger, stmt, customResultMapper } = this;
        if (!fields && !customResultMapper) {
          const params = fillPlaceholders(query.params, placeholderValues ?? {});
          logger.logQuery(query.sql, params);
          return stmt.bind(...params).all().then(({ results }) => results[0]);
        }
        const rows = await this.values(placeholderValues);
        if (!rows[0]) {
          return void 0;
        }
        if (customResultMapper) {
          return customResultMapper(rows);
        }
        return mapResultRow(fields, rows[0], joinsNotNullableMap);
      }
      mapGetResult(result, isFromBatch) {
        if (isFromBatch) {
          result = d1ToRawMapping(result.results)[0];
        }
        if (!this.fields && !this.customResultMapper) {
          return result;
        }
        if (this.customResultMapper) {
          return this.customResultMapper([result]);
        }
        return mapResultRow(this.fields, result, this.joinsNotNullableMap);
      }
      values(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
        this.logger.logQuery(this.query.sql, params);
        return this.stmt.bind(...params).raw();
      }
      /** @internal */
      isResponseInArrayMode() {
        return this._isResponseInArrayMode;
      }
    };
    _a109 = entityKind;
    __publicField(D1PreparedQuery, _a109, "D1PreparedQuery");
  }
});
function drizzle(client, config = {}) {
  const dialect = new SQLiteAsyncDialect();
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new SQLiteD1Session(client, dialect, schema, { logger });
  return new DrizzleD1Database("async", dialect, session, schema);
}
var _a110;
var DrizzleD1Database;
var init_driver = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/d1/driver.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_entity();
    init_logger();
    init_relations();
    init_db();
    init_dialect();
    init_session2();
    DrizzleD1Database = class extends BaseSQLiteDatabase {
      async batch(batch) {
        return this.session.batch(batch);
      }
    };
    _a110 = entityKind;
    __publicField(DrizzleD1Database, _a110, "D1Database");
  }
});
var init_d1 = __esm({
  "../../node_modules/.pnpm/drizzle-orm@0.30.10_@cloudflare+workers-types@4.20240821.1_postgres@3.4.4/node_modules/drizzle-orm/d1/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_driver();
    init_session2();
  }
});
var TRPC_ERROR_CODES_BY_KEY;
var TRPC_ERROR_CODES_BY_NUMBER;
var init_codes = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/rpc/codes.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    TRPC_ERROR_CODES_BY_KEY = {
      /**
      * Invalid JSON was received by the server.
      * An error occurred on the server while parsing the JSON text.
      */
      PARSE_ERROR: -32700,
      /**
      * The JSON sent is not a valid Request object.
      */
      BAD_REQUEST: -32600,
      // Internal JSON-RPC error
      INTERNAL_SERVER_ERROR: -32603,
      NOT_IMPLEMENTED: -32603,
      // Implementation specific errors
      UNAUTHORIZED: -32001,
      FORBIDDEN: -32003,
      NOT_FOUND: -32004,
      METHOD_NOT_SUPPORTED: -32005,
      TIMEOUT: -32008,
      CONFLICT: -32009,
      PRECONDITION_FAILED: -32012,
      UNSUPPORTED_MEDIA_TYPE: -32015,
      PAYLOAD_TOO_LARGE: -32013,
      UNPROCESSABLE_CONTENT: -32022,
      TOO_MANY_REQUESTS: -32029,
      CLIENT_CLOSED_REQUEST: -32099
    };
    TRPC_ERROR_CODES_BY_NUMBER = {
      [-32700]: "PARSE_ERROR",
      [-32600]: "BAD_REQUEST",
      [-32603]: "INTERNAL_SERVER_ERROR",
      [-32001]: "UNAUTHORIZED",
      [-32003]: "FORBIDDEN",
      [-32004]: "NOT_FOUND",
      [-32005]: "METHOD_NOT_SUPPORTED",
      [-32008]: "TIMEOUT",
      [-32009]: "CONFLICT",
      [-32012]: "PRECONDITION_FAILED",
      [-32013]: "PAYLOAD_TOO_LARGE",
      [-32015]: "UNSUPPORTED_MEDIA_TYPE",
      [-32022]: "UNPROCESSABLE_CONTENT",
      [-32029]: "TOO_MANY_REQUESTS",
      [-32099]: "CLIENT_CLOSED_REQUEST"
    };
  }
});
function getStatusCodeFromKey(code) {
  return JSONRPC2_TO_HTTP_CODE[code] ?? 500;
}
function getHTTPStatusCode(json) {
  const arr = Array.isArray(json) ? json : [
    json
  ];
  const httpStatuses = new Set(arr.map((res) => {
    if ("error" in res) {
      const data = res.error.data;
      if (typeof data.httpStatus === "number") {
        return data.httpStatus;
      }
      const code = TRPC_ERROR_CODES_BY_NUMBER[res.error.code];
      return getStatusCodeFromKey(code);
    }
    return 200;
  }));
  if (httpStatuses.size !== 1) {
    return 207;
  }
  const httpStatus = httpStatuses.values().next().value;
  return httpStatus;
}
function getHTTPStatusCodeFromError(error) {
  return getStatusCodeFromKey(error.code);
}
var JSONRPC2_TO_HTTP_CODE;
var init_getHTTPStatusCode = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/http/getHTTPStatusCode.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_codes();
    JSONRPC2_TO_HTTP_CODE = {
      PARSE_ERROR: 400,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      METHOD_NOT_SUPPORTED: 405,
      TIMEOUT: 408,
      CONFLICT: 409,
      PRECONDITION_FAILED: 412,
      PAYLOAD_TOO_LARGE: 413,
      UNSUPPORTED_MEDIA_TYPE: 415,
      UNPROCESSABLE_CONTENT: 422,
      TOO_MANY_REQUESTS: 429,
      CLIENT_CLOSED_REQUEST: 499,
      INTERNAL_SERVER_ERROR: 500,
      NOT_IMPLEMENTED: 501
    };
  }
});
function getErrorShape(opts) {
  const { path, error, config } = opts;
  const { code } = opts.error;
  const shape = {
    message: error.message,
    code: TRPC_ERROR_CODES_BY_KEY[code],
    data: {
      code,
      httpStatus: getHTTPStatusCodeFromError(error)
    }
  };
  if (config.isDev && typeof opts.error.stack === "string") {
    shape.data.stack = opts.error.stack;
  }
  if (typeof path === "string") {
    shape.data.path = path;
  }
  return config.errorFormatter({
    ...opts,
    shape
  });
}
var init_getErrorShape = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/error/getErrorShape.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_getHTTPStatusCode();
    init_codes();
  }
});
function mergeWithoutOverrides(obj1, ...objs) {
  const newObj = Object.assign(/* @__PURE__ */ Object.create(null), obj1);
  for (const overrides of objs) {
    for (const key in overrides) {
      if (key in newObj && newObj[key] !== overrides[key]) {
        throw new Error(`Duplicate key ${key}`);
      }
      newObj[key] = overrides[key];
    }
  }
  return newObj;
}
function isObject(value) {
  return !!value && !Array.isArray(value) && typeof value === "object";
}
function isFunction(fn) {
  return typeof fn === "function";
}
function omitPrototype(obj) {
  return Object.assign(/* @__PURE__ */ Object.create(null), obj);
}
function isAsyncIterable(value) {
  return asyncIteratorsSupported && isObject(value) && Symbol.asyncIterator in value;
}
var unsetMarker;
var asyncIteratorsSupported;
var init_utils3 = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/utils.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    unsetMarker = Symbol("unsetMarker");
    asyncIteratorsSupported = typeof Symbol === "function" && !!Symbol.asyncIterator;
  }
});
function getCauseFromUnknown(cause) {
  if (cause instanceof Error) {
    return cause;
  }
  const type = typeof cause;
  if (type === "undefined" || type === "function" || cause === null) {
    return void 0;
  }
  if (type !== "object") {
    return new Error(String(cause));
  }
  if (isObject(cause)) {
    const err = new UnknownCauseError();
    for (const key in cause) {
      err[key] = cause[key];
    }
    return err;
  }
  return void 0;
}
function getTRPCErrorFromUnknown(cause) {
  if (cause instanceof TRPCError) {
    return cause;
  }
  if (cause instanceof Error && cause.name === "TRPCError") {
    return cause;
  }
  const trpcError = new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    cause
  });
  if (cause instanceof Error && cause.stack) {
    trpcError.stack = cause.stack;
  }
  return trpcError;
}
var UnknownCauseError;
var TRPCError;
var init_TRPCError = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/error/TRPCError.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils3();
    UnknownCauseError = class extends Error {
    };
    TRPCError = class extends Error {
      constructor(opts) {
        const cause = getCauseFromUnknown(opts.cause);
        const message = opts.message ?? cause?.message ?? opts.code;
        super(message, {
          cause
        });
        this.code = opts.code;
        this.name = "TRPCError";
        if (!this.cause) {
          this.cause = cause;
        }
      }
    };
  }
});
function createInnerProxy(callback, path) {
  const proxy = new Proxy(noop, {
    get(_obj, key) {
      if (typeof key !== "string" || key === "then") {
        return void 0;
      }
      return createInnerProxy(callback, [
        ...path,
        key
      ]);
    },
    apply(_1, _2, args) {
      const lastOfPath = path[path.length - 1];
      let opts = {
        args,
        path
      };
      if (lastOfPath === "call") {
        opts = {
          args: args.length >= 2 ? [
            args[1]
          ] : [],
          path: path.slice(0, -1)
        };
      } else if (lastOfPath === "apply") {
        opts = {
          args: args.length >= 2 ? args[1] : [],
          path: path.slice(0, -1)
        };
      }
      return callback(opts);
    }
  });
  return proxy;
}
var noop;
var createRecursiveProxy;
var init_createProxy = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/createProxy.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    noop = () => {
    };
    createRecursiveProxy = (callback) => createInnerProxy(callback, []);
  }
});
var defaultFormatter;
var init_formatter = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/error/formatter.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    defaultFormatter = ({ shape }) => {
      return shape;
    };
  }
});
function getDataTransformer(transformer) {
  if ("input" in transformer) {
    return transformer;
  }
  return {
    input: transformer,
    output: transformer
  };
}
function transformTRPCResponseItem(config, item) {
  if ("error" in item) {
    return {
      ...item,
      error: config.transformer.output.serialize(item.error)
    };
  }
  if ("data" in item.result) {
    return {
      ...item,
      result: {
        ...item.result,
        data: config.transformer.output.serialize(item.result.data)
      }
    };
  }
  return item;
}
function transformTRPCResponse(config, itemOrItems) {
  return Array.isArray(itemOrItems) ? itemOrItems.map((item) => transformTRPCResponseItem(config, item)) : transformTRPCResponseItem(config, itemOrItems);
}
var defaultTransformer;
var init_transformer = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/transformer.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils3();
    defaultTransformer = {
      input: {
        serialize: (obj) => obj,
        deserialize: (obj) => obj
      },
      output: {
        serialize: (obj) => obj,
        deserialize: (obj) => obj
      }
    };
  }
});
function isRouter(procedureOrRouter) {
  return procedureOrRouter._def && "router" in procedureOrRouter._def;
}
function createRouterFactory(config) {
  function createRouterInner(input) {
    const reservedWordsUsed = new Set(Object.keys(input).filter((v) => reservedWords.includes(v)));
    if (reservedWordsUsed.size > 0) {
      throw new Error("Reserved words used in `router({})` call: " + Array.from(reservedWordsUsed).join(", "));
    }
    const procedures = omitPrototype({});
    function step(from, path = []) {
      const aggregate = omitPrototype({});
      for (const [key, item] of Object.entries(from ?? {})) {
        if (isRouter(item)) {
          aggregate[key] = step(item._def.record, [
            ...path,
            key
          ]);
          continue;
        }
        if (!isProcedure(item)) {
          aggregate[key] = step(item, [
            ...path,
            key
          ]);
          continue;
        }
        const newPath = [
          ...path,
          key
        ].join(".");
        if (procedures[newPath]) {
          throw new Error(`Duplicate key: ${newPath}`);
        }
        procedures[newPath] = item;
        aggregate[key] = item;
      }
      return aggregate;
    }
    const record = step(input);
    const _def = {
      _config: config,
      router: true,
      procedures,
      ...emptyRouter,
      record
    };
    return {
      ...record,
      _def,
      createCaller: createCallerFactory()({
        _def
      })
    };
  }
  return createRouterInner;
}
function isProcedure(procedureOrRouter) {
  return typeof procedureOrRouter === "function";
}
function callProcedure(opts) {
  const { type, path } = opts;
  const proc = opts.procedures[path];
  if (!proc || !isProcedure(proc) || proc._def.type !== type && !opts.allowMethodOverride) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No "${type}"-procedure on path "${path}"`
    });
  }
  return proc(opts);
}
function createCallerFactory() {
  return function createCallerInner(router2) {
    const _def = router2._def;
    return function createCaller(ctxOrCallback, options) {
      const proxy = createRecursiveProxy(async ({ path, args }) => {
        const fullPath = path.join(".");
        const procedure = _def.procedures[fullPath];
        let ctx = void 0;
        try {
          ctx = isFunction(ctxOrCallback) ? await Promise.resolve(ctxOrCallback()) : ctxOrCallback;
          return await procedure({
            path: fullPath,
            getRawInput: async () => args[0],
            ctx,
            type: procedure._def.type
          });
        } catch (cause) {
          options?.onError?.({
            ctx,
            error: getTRPCErrorFromUnknown(cause),
            input: args[0],
            path: fullPath,
            type: procedure._def.type
          });
          throw cause;
        }
      });
      return proxy;
    };
  };
}
function mergeRouters(...routerList) {
  const record = mergeWithoutOverrides({}, ...routerList.map((r) => r._def.record));
  const errorFormatter = routerList.reduce((currentErrorFormatter, nextRouter) => {
    if (nextRouter._def._config.errorFormatter && nextRouter._def._config.errorFormatter !== defaultFormatter) {
      if (currentErrorFormatter !== defaultFormatter && currentErrorFormatter !== nextRouter._def._config.errorFormatter) {
        throw new Error("You seem to have several error formatters");
      }
      return nextRouter._def._config.errorFormatter;
    }
    return currentErrorFormatter;
  }, defaultFormatter);
  const transformer = routerList.reduce((prev, current) => {
    if (current._def._config.transformer && current._def._config.transformer !== defaultTransformer) {
      if (prev !== defaultTransformer && prev !== current._def._config.transformer) {
        throw new Error("You seem to have several transformers");
      }
      return current._def._config.transformer;
    }
    return prev;
  }, defaultTransformer);
  const router2 = createRouterFactory({
    errorFormatter,
    transformer,
    isDev: routerList.every((r) => r._def._config.isDev),
    allowOutsideOfServer: routerList.every((r) => r._def._config.allowOutsideOfServer),
    isServer: routerList.every((r) => r._def._config.isServer),
    $types: routerList[0]?._def._config.$types
  })(record);
  return router2;
}
var emptyRouter;
var reservedWords;
var init_router = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/router.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_createProxy();
    init_formatter();
    init_TRPCError();
    init_transformer();
    init_utils3();
    emptyRouter = {
      _ctx: null,
      _errorShape: null,
      _meta: null,
      queries: {},
      mutations: {},
      subscriptions: {},
      errorFormatter: defaultFormatter,
      transformer: defaultTransformer
    };
    reservedWords = [
      /**
      * Then is a reserved word because otherwise we can't return a promise that returns a Proxy
      * since JS will think that `.then` is something that exists
      */
      "then",
      /**
      * `fn.call()` and `fn.apply()` are reserved words because otherwise we can't call a function using `.call` or `.apply`
      */
      "call",
      "apply"
    ];
  }
});
function createReadableStream() {
  let controller = null;
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    }
  });
  return [
    stream,
    controller
  ];
}
function isPromise(value) {
  return (isObject(value) || isFunction(value)) && typeof value?.["then"] === "function" && typeof value?.["catch"] === "function";
}
function createBatchStreamProducer(opts) {
  const { data } = opts;
  let counter = 0;
  const placeholder = 0;
  const [stream, controller] = createReadableStream();
  const pending = /* @__PURE__ */ new Set();
  function maybeClose() {
    if (pending.size === 0) {
      controller.close();
    }
  }
  function hydratePromise(promise, path) {
    const error = checkMaxDepth(path);
    if (error) {
      promise.catch(() => {
      });
      promise = Promise.reject(error);
    }
    const idx = counter++;
    pending.add(idx);
    const enqueue = (value) => {
      controller.enqueue(value);
    };
    promise.then((it) => {
      enqueue([
        idx,
        PROMISE_STATUS_FULFILLED,
        hydrate(it, path)
      ]);
    }).catch((error2) => {
      opts.onError?.({
        error: error2,
        path
      });
      enqueue([
        idx,
        PROMISE_STATUS_REJECTED,
        opts.formatError?.({
          error: error2,
          path
        })
      ]);
    }).finally(() => {
      pending.delete(idx);
      maybeClose();
    });
    return idx;
  }
  function hydrateAsyncIterable(iterable, path) {
    const error = checkMaxDepth(path);
    if (error) {
      iterable = {
        [Symbol.asyncIterator]() {
          throw error;
        }
      };
    }
    const idx = counter++;
    pending.add(idx);
    void (async () => {
      try {
        for await (const item of iterable) {
          controller.enqueue([
            idx,
            ASYNC_ITERABLE_STATUS_VALUE,
            hydrate(item, path)
          ]);
        }
        controller.enqueue([
          idx,
          ASYNC_ITERABLE_STATUS_DONE
        ]);
      } catch (error2) {
        opts.onError?.({
          error: error2,
          path
        });
        controller.enqueue([
          idx,
          ASYNC_ITERABLE_STATUS_ERROR,
          opts.formatError?.({
            error: error2,
            path
          })
        ]);
      } finally {
        pending.delete(idx);
        maybeClose();
      }
    })();
    return idx;
  }
  function checkMaxDepth(path) {
    if (opts.maxDepth && path.length > opts.maxDepth) {
      return new MaxDepthError(path);
    }
    return null;
  }
  function hydrateChunk(value, path) {
    if (isPromise(value)) {
      return [
        CHUNK_VALUE_TYPE_PROMISE,
        hydratePromise(value, path)
      ];
    }
    if (isAsyncIterable(value)) {
      if (opts.maxDepth && path.length >= opts.maxDepth) {
        throw new Error("Max depth reached");
      }
      return [
        CHUNK_VALUE_TYPE_ASYNC_ITERABLE,
        hydrateAsyncIterable(value, path)
      ];
    }
    return null;
  }
  function hydrate(value, path) {
    const reg = hydrateChunk(value, path);
    if (reg) {
      return [
        [
          placeholder
        ],
        [
          null,
          ...reg
        ]
      ];
    }
    if (!isObject(value)) {
      return [
        [
          value
        ]
      ];
    }
    const newObj = {};
    const asyncValues = [];
    for (const [key, item] of Object.entries(value)) {
      const transformed = hydrateChunk(item, [
        ...path,
        key
      ]);
      if (!transformed) {
        newObj[key] = item;
        continue;
      }
      newObj[key] = placeholder;
      asyncValues.push([
        key,
        ...transformed
      ]);
    }
    return [
      [
        newObj
      ],
      ...asyncValues
    ];
  }
  const newHead = {};
  for (const [key, item] of Object.entries(data)) {
    newHead[key] = hydrate(item, [
      key
    ]);
  }
  return [
    newHead,
    stream
  ];
}
function jsonlStreamProducer(opts) {
  let [head, stream] = createBatchStreamProducer(opts);
  const { serialize: serialize2 } = opts;
  if (serialize2) {
    head = serialize2(head);
    stream = stream.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(serialize2(chunk));
      }
    }));
  }
  return stream.pipeThrough(new TransformStream({
    start(controller) {
      controller.enqueue(JSON.stringify(head) + "\n");
    },
    transform(chunk, controller) {
      controller.enqueue(JSON.stringify(chunk) + "\n");
    }
  })).pipeThrough(new TextEncoderStream());
}
var CHUNK_VALUE_TYPE_PROMISE;
var CHUNK_VALUE_TYPE_ASYNC_ITERABLE;
var PROMISE_STATUS_FULFILLED;
var PROMISE_STATUS_REJECTED;
var ASYNC_ITERABLE_STATUS_DONE;
var ASYNC_ITERABLE_STATUS_VALUE;
var ASYNC_ITERABLE_STATUS_ERROR;
var MaxDepthError;
var init_stream = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/stream/stream.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils3();
    CHUNK_VALUE_TYPE_PROMISE = 0;
    CHUNK_VALUE_TYPE_ASYNC_ITERABLE = 1;
    PROMISE_STATUS_FULFILLED = 0;
    PROMISE_STATUS_REJECTED = 1;
    ASYNC_ITERABLE_STATUS_DONE = 0;
    ASYNC_ITERABLE_STATUS_VALUE = 1;
    ASYNC_ITERABLE_STATUS_ERROR = 2;
    MaxDepthError = class extends Error {
      constructor(path) {
        super("Max depth reached at path: " + path.join("."));
        this.path = path;
      }
    };
  }
});
function memo(fn) {
  let promise = null;
  let value = unsetMarker;
  return {
    /**
    * Lazily read the value
    */
    read: async () => {
      if (value !== unsetMarker) {
        return value;
      }
      if (promise === null) {
        promise = fn().catch((cause) => {
          if (cause instanceof TRPCError) {
            throw cause;
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: cause instanceof Error ? cause.message : "Invalid input",
            cause
          });
        });
      }
      value = await promise;
      promise = null;
      return value;
    },
    /**
    * Get an already stored result
    */
    result: () => {
      return value !== unsetMarker ? value : void 0;
    }
  };
}
function getContentTypeHandler(req) {
  const handler = handlers.find((handler2) => handler2.isMatch(req));
  if (handler) {
    return handler;
  }
  if (!handler && req.method === "GET") {
    return jsonContentTypeHandler;
  }
  throw new TRPCError({
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: req.headers.has("content-type") ? `Unsupported content-type "${req.headers.get("content-type")}` : "Missing content-type header"
  });
}
function getRequestInfo(opts) {
  const handler = getContentTypeHandler(opts.req);
  return handler.parse(opts);
}
var jsonContentTypeHandler;
var formDataContentTypeHandler;
var octetStreamContentTypeHandler;
var handlers;
var init_contentType = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/http/contentType.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_TRPCError();
    init_utils3();
    jsonContentTypeHandler = {
      isMatch(req) {
        return !!req.headers.get("content-type")?.startsWith("application/json");
      },
      parse(opts) {
        const { req } = opts;
        const isBatchCall = opts.searchParams.get("batch") === "1";
        const paths = isBatchCall ? opts.path.split(",") : [
          opts.path
        ];
        const getInputs = memo(async () => {
          let inputs = void 0;
          if (req.method === "GET") {
            const queryInput = opts.searchParams.get("input");
            if (queryInput) {
              inputs = JSON.parse(queryInput);
            }
          } else {
            inputs = await req.json();
          }
          if (inputs === void 0) {
            return {};
          }
          if (!isBatchCall) {
            return {
              0: opts.config.transformer.input.deserialize(inputs)
            };
          }
          if (!isObject(inputs)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: '"input" needs to be an object when doing a batch call'
            });
          }
          const acc = {};
          for (const index of paths.keys()) {
            const input = inputs[index];
            if (input !== void 0) {
              acc[index] = opts.config.transformer.input.deserialize(input);
            }
          }
          return acc;
        });
        return {
          isBatchCall,
          calls: paths.map((path, index) => ({
            path,
            getRawInput: async () => {
              const inputs = await getInputs.read();
              return inputs[index];
            },
            result: () => {
              return getInputs.result()?.[index];
            }
          }))
        };
      }
    };
    formDataContentTypeHandler = {
      isMatch(req) {
        return !!req.headers.get("content-type")?.startsWith("multipart/form-data");
      },
      parse(opts) {
        const { req } = opts;
        if (req.method !== "POST") {
          throw new TRPCError({
            code: "METHOD_NOT_SUPPORTED",
            message: "Only POST requests are supported for multipart/form-data requests"
          });
        }
        const getInputs = memo(async () => {
          const fd = await req.formData();
          return fd;
        });
        return {
          calls: [
            {
              path: opts.path,
              getRawInput: getInputs.read,
              result: getInputs.result
            }
          ],
          isBatchCall: false
        };
      }
    };
    octetStreamContentTypeHandler = {
      isMatch(req) {
        return !!req.headers.get("content-type")?.startsWith("application/octet-stream");
      },
      parse(opts) {
        const { req } = opts;
        if (req.method !== "POST") {
          throw new TRPCError({
            code: "METHOD_NOT_SUPPORTED",
            message: "Only POST requests are supported for application/octet-stream requests"
          });
        }
        const getInputs = memo(async () => {
          return req.body;
        });
        return {
          calls: [
            {
              path: opts.path,
              getRawInput: getInputs.read,
              result: getInputs.result
            }
          ],
          isBatchCall: false
        };
      }
    };
    handlers = [
      jsonContentTypeHandler,
      formDataContentTypeHandler,
      octetStreamContentTypeHandler
    ];
  }
});
function initResponse(initOpts) {
  const { ctx, info, type, responseMeta, untransformedJSON, errors = [], headers } = initOpts;
  let status = untransformedJSON ? getHTTPStatusCode(untransformedJSON) : 200;
  const eagerGeneration = !untransformedJSON;
  const data = eagerGeneration ? [] : Array.isArray(untransformedJSON) ? untransformedJSON : [
    untransformedJSON
  ];
  const meta = responseMeta?.({
    ctx,
    info,
    paths: info?.calls.map((call) => call.path),
    type,
    data,
    errors,
    eagerGeneration
  }) ?? {};
  if (meta.headers) {
    if (meta.headers instanceof Headers) {
      for (const [key, value] of meta.headers.entries()) {
        headers.append(key, value);
      }
    } else {
      for (const [key1, value1] of Object.entries(meta.headers)) {
        if (Array.isArray(value1)) {
          for (const v of value1) {
            headers.append(key1, v);
          }
        } else if (typeof value1 === "string") {
          headers.set(key1, value1);
        }
      }
    }
  }
  if (meta.status) {
    status = meta.status;
  }
  return {
    status
  };
}
function caughtErrorToData(cause, errorOpts) {
  const { router: router2, req, onError } = errorOpts.opts;
  const error = getTRPCErrorFromUnknown(cause);
  onError?.({
    error,
    path: errorOpts.path,
    input: errorOpts.input,
    ctx: errorOpts.ctx,
    type: errorOpts.type,
    req
  });
  const untransformedJSON = {
    error: getErrorShape({
      config: router2._def._config,
      error,
      type: errorOpts.type,
      path: errorOpts.path,
      input: errorOpts.input,
      ctx: errorOpts.ctx
    })
  };
  const transformedJSON = transformTRPCResponse(router2._def._config, untransformedJSON);
  const body = JSON.stringify(transformedJSON);
  return {
    error,
    untransformedJSON,
    body
  };
}
async function resolveResponse(opts) {
  const { router: router2, req } = opts;
  const headers = new Headers([
    [
      "vary",
      "trpc-accept"
    ]
  ]);
  const config = router2._def._config;
  const url = new URL(req.url);
  if (req.method === "HEAD") {
    return new Response(null, {
      status: 204
    });
  }
  const allowBatching = opts.allowBatching ?? opts.batching?.enabled ?? true;
  const allowMethodOverride = (opts.allowMethodOverride ?? false) && req.method === "POST";
  const type = HTTP_METHOD_PROCEDURE_TYPE_MAP[req.method] ?? "unknown";
  let ctx = void 0;
  let info = void 0;
  const isStreamCall = req.headers.get("trpc-accept") === "application/jsonl";
  const experimentalIterablesAndDeferreds = config.experimental?.iterablesAndDeferreds ?? false;
  try {
    info = getRequestInfo({
      req,
      path: decodeURIComponent(opts.path),
      config,
      searchParams: url.searchParams
    });
    ctx = await opts.createContext({
      info
    });
    if (opts.error) {
      throw opts.error;
    }
    if (info.isBatchCall && !allowBatching) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Batching is not enabled on the server`
      });
    }
    if (type === "unknown") {
      throw new TRPCError({
        message: `Unexpected request method ${req.method}`,
        code: "METHOD_NOT_SUPPORTED"
      });
    }
    const errors = [];
    const promises = info.calls.map(async (call) => {
      try {
        const data = await callProcedure({
          procedures: opts.router._def.procedures,
          path: call.path,
          getRawInput: call.getRawInput,
          ctx,
          type,
          allowMethodOverride
        });
        if ((!isStreamCall || !experimentalIterablesAndDeferreds) && isObject(data) && (Symbol.asyncIterator in data || Object.values(data).some(isPromise))) {
          if (!isStreamCall) {
            throw new TRPCError({
              code: "UNSUPPORTED_MEDIA_TYPE",
              message: "Cannot return async iterable or nested promises in non-streaming response"
            });
          }
          if (!experimentalIterablesAndDeferreds) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: 'Missing experimental flag "iterablesAndDeferreds"'
            });
          }
        }
        return {
          result: {
            data
          }
        };
      } catch (cause) {
        const error = getTRPCErrorFromUnknown(cause);
        errors.push(error);
        const input = call.result();
        opts.onError?.({
          error,
          path: call.path,
          input,
          ctx,
          type,
          req: opts.req
        });
        return {
          error: getErrorShape({
            config,
            error,
            type,
            path: call.path,
            input,
            ctx
          })
        };
      }
    });
    if (!isStreamCall) {
      headers.set("content-type", "application/json");
      const untransformedJSON = await Promise.all(promises);
      const errors1 = untransformedJSON.flatMap((response) => "error" in response ? [
        response.error
      ] : []);
      const headResponse = initResponse({
        ctx,
        info,
        type,
        responseMeta: opts.responseMeta,
        untransformedJSON,
        errors: errors1,
        headers
      });
      const result = info.isBatchCall ? untransformedJSON : untransformedJSON[0];
      const transformedJSON = transformTRPCResponse(router2._def._config, result);
      const body = JSON.stringify(transformedJSON);
      return new Response(body, {
        status: headResponse.status,
        headers
      });
    }
    headers.set("content-type", "application/json");
    headers.set("transfer-encoding", "chunked");
    const headResponse1 = initResponse({
      ctx,
      info,
      type,
      responseMeta: opts.responseMeta,
      errors: [],
      headers
    });
    const stream = jsonlStreamProducer({
      /**
      * Example structure for `maxDepth: 4`:
      * {
      *   // 1
      *   0: {
      *     // 2
      *     result: {
      *       // 3
      *       data: // 4
      *     }
      *   }
      * }
      */
      maxDepth: experimentalIterablesAndDeferreds ? 4 : 3,
      formatError(errorOpts) {
        const call = info?.calls[errorOpts.path[0]];
        return getErrorShape({
          config,
          ctx,
          error: getTRPCErrorFromUnknown(errorOpts.error),
          input: call?.result(),
          path: call?.path,
          type
        });
      },
      data: promises.map(async (it) => {
        const response = await it;
        if ("result" in response) {
          return {
            ...response,
            result: Promise.resolve({
              ...response.result,
              data: Promise.resolve(response.result.data)
            })
          };
        }
        return response;
      }),
      serialize: config.transformer.output.serialize,
      onError: (cause) => {
        opts.onError?.({
          error: getTRPCErrorFromUnknown(cause),
          path: void 0,
          input: void 0,
          ctx,
          type,
          req: opts.req
        });
      }
    });
    return new Response(stream, {
      headers,
      status: headResponse1.status
    });
  } catch (cause) {
    const { error, untransformedJSON: untransformedJSON1, body: body1 } = caughtErrorToData(cause, {
      opts,
      ctx,
      type
    });
    const headResponse2 = initResponse({
      ctx,
      info,
      type,
      responseMeta: opts.responseMeta,
      untransformedJSON: untransformedJSON1,
      errors: [
        error
      ],
      headers
    });
    return new Response(body1, {
      status: headResponse2.status,
      headers
    });
  }
}
var HTTP_METHOD_PROCEDURE_TYPE_MAP;
var init_resolveResponse = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/http/resolveResponse.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_getErrorShape();
    init_TRPCError();
    init_router();
    init_stream();
    init_transformer();
    init_utils3();
    init_contentType();
    init_getHTTPStatusCode();
    HTTP_METHOD_PROCEDURE_TYPE_MAP = {
      GET: "query",
      POST: "mutation"
    };
  }
});
function toURL(urlOrPathname) {
  const url = urlOrPathname.startsWith("/") ? `http://127.0.0.1${urlOrPathname}` : urlOrPathname;
  return new URL(url);
}
var init_toURL = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/http/toURL.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
var isServerDefault;
var init_rootConfig = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/rootConfig.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    isServerDefault = typeof window === "undefined" || "Deno" in window || // eslint-disable-next-line @typescript-eslint/dot-notation
    globalThis.process?.env?.["NODE_ENV"] === "test" || !!globalThis.process?.env?.["JEST_WORKER_ID"] || !!globalThis.process?.env?.["VITEST_WORKER_ID"];
  }
});
async function fetchRequestHandler(opts) {
  const resHeaders = new Headers();
  const createContext = async (innerOpts) => {
    return opts.createContext?.({
      req: opts.req,
      resHeaders,
      ...innerOpts
    });
  };
  const url = toURL(opts.req.url);
  const pathname = trimSlashes(url.pathname);
  const endpoint = trimSlashes(opts.endpoint);
  const path = trimSlashes(pathname.slice(endpoint.length));
  return await resolveResponse({
    ...opts,
    req: opts.req,
    createContext,
    path,
    error: null,
    onError(o) {
      opts?.onError?.({
        ...o,
        req: opts.req
      });
    },
    responseMeta(data) {
      const meta = opts.responseMeta?.(data);
      if (meta?.headers) {
        if (meta.headers instanceof Headers) {
          for (const [key, value] of meta.headers.entries()) {
            resHeaders.append(key, value);
          }
        } else {
          for (const [key1, value1] of Object.entries(meta.headers)) {
            if (Array.isArray(value1)) {
              for (const v of value1) {
                resHeaders.append(key1, v);
              }
            } else if (typeof value1 === "string") {
              resHeaders.set(key1, value1);
            }
          }
        }
      }
      return {
        headers: resHeaders,
        status: meta?.status
      };
    }
  });
}
var trimSlashes;
var init_fetchRequestHandler = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/adapters/fetch/fetchRequestHandler.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_resolveResponse();
    init_toURL();
    init_rootConfig();
    trimSlashes = (path) => {
      path = path.startsWith("/") ? path.slice(1) : path;
      path = path.endsWith("/") ? path.slice(0, -1) : path;
      return path;
    };
  }
});
var init_fetch = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/adapters/fetch/index.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_fetchRequestHandler();
  }
});
var schema_exports = {};
__export(schema_exports, {
  catagories: () => catagories,
  catagoriesPosts: () => catagoriesPosts,
  catagoriesPostsRelations: () => catagoriesPostsRelations,
  catagoryRelations: () => catagoryRelations,
  postRelations: () => postRelations,
  posts: () => posts,
  profiles: () => profiles,
  userRelations: () => userRelations,
  users: () => users
});
var users;
var userRelations;
var posts;
var postRelations;
var catagories;
var catagoryRelations;
var catagoriesPosts;
var catagoriesPostsRelations;
var profiles;
var init_schema = __esm({
  "../dist/schemas/schema.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_sqlite_core();
    init_drizzle_orm();
    users = sqliteTable("users", {
      userId: integer("user_id").primaryKey(),
      name: text("name"),
      email: text("email", { length: 256 }).notNull()
    });
    userRelations = relations(users, ({ one, many }) => ({
      profile: one(profiles, {
        fields: [users.userId],
        references: [profiles.userId]
      }),
      posts: many(posts)
    }));
    posts = sqliteTable("posts", {
      postId: integer("post_id").primaryKey(),
      title: text("title", { length: 256 }).notNull(),
      body: text("body").notNull(),
      slug: text("title", { length: 40 }),
      userId: integer("user_id").notNull().references(() => users.userId)
    });
    postRelations = relations(posts, ({ one, many }) => ({
      author: one(users, {
        fields: [posts.userId],
        references: [users.userId]
      }),
      postCatagories: many(catagoriesPosts)
    }));
    catagories = sqliteTable("catagories", {
      catagoryId: integer("catagory_id").primaryKey(),
      catagory: text("catagory", { length: 40 }).notNull()
    });
    catagoryRelations = relations(catagories, ({ many }) => ({
      catagoryPosts: many(catagoriesPosts)
    }));
    catagoriesPosts = sqliteTable("catagories_posts", {
      catagoryId: integer("catagory_id").notNull().references(() => catagories.catagoryId),
      postId: integer("post_id").notNull().references(() => posts.postId)
    }, (table) => ({
      pk: primaryKey({ columns: [table.postId, table.catagoryId] })
    }));
    catagoriesPostsRelations = relations(catagoriesPosts, ({ one }) => ({
      postCatagories: one(catagories, {
        fields: [catagoriesPosts.catagoryId],
        references: [catagories.catagoryId]
      }),
      catagoryPosts: one(posts, {
        fields: [catagoriesPosts.postId],
        references: [posts.postId]
      })
    }));
    profiles = sqliteTable("profiles", {
      profileId: integer("id").primaryKey(),
      bio: text("bio", { length: 256 }),
      userId: integer("user_id").notNull().references(() => users.userId)
    });
  }
});
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    var _a111, _b;
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: (_a111 = message !== null && message !== void 0 ? message : required_error) !== null && _a111 !== void 0 ? _a111 : ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
function timeRegexSource(args) {
  let regex = `([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;
  if (args.precision) {
    regex = `${regex}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    regex = `${regex}(\\.\\d+)?`;
  }
  return regex;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / Math.pow(10, decCount);
}
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
function custom(check, params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      var _a111, _b;
      if (!check(data)) {
        const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
        const _fatal = (_b = (_a111 = p.fatal) !== null && _a111 !== void 0 ? _a111 : fatal) !== null && _b !== void 0 ? _b : true;
        const p2 = typeof p === "string" ? { message: p } : p;
        ctx.addIssue({ code: "custom", ...p2, fatal: _fatal });
      }
    });
  return ZodAny.create();
}
var util;
var objectUtil;
var ZodParsedType;
var getParsedType;
var ZodIssueCode;
var quotelessJson;
var ZodError;
var errorMap;
var overrideErrorMap;
var makeIssue;
var EMPTY_PATH;
var ParseStatus;
var INVALID;
var DIRTY;
var OK;
var isAborted;
var isDirty;
var isValid;
var isAsync;
var errorUtil;
var _ZodEnum_cache;
var _ZodNativeEnum_cache;
var ParseInputLazyPath;
var handleResult;
var ZodType;
var cuidRegex;
var cuid2Regex;
var ulidRegex;
var uuidRegex;
var nanoidRegex;
var durationRegex;
var emailRegex;
var _emojiRegex;
var emojiRegex;
var ipv4Regex;
var ipv6Regex;
var base64Regex;
var dateRegexSource;
var dateRegex;
var ZodString;
var ZodNumber;
var ZodBigInt;
var ZodBoolean;
var ZodDate;
var ZodSymbol;
var ZodUndefined;
var ZodNull;
var ZodAny;
var ZodUnknown;
var ZodNever;
var ZodVoid;
var ZodArray;
var ZodObject;
var ZodUnion;
var getDiscriminator;
var ZodDiscriminatedUnion;
var ZodIntersection;
var ZodTuple;
var ZodRecord;
var ZodMap;
var ZodSet;
var ZodFunction;
var ZodLazy;
var ZodLiteral;
var ZodEnum;
var ZodNativeEnum;
var ZodPromise;
var ZodEffects;
var ZodOptional;
var ZodNullable;
var ZodDefault;
var ZodCatch;
var ZodNaN;
var BRAND;
var ZodBranded;
var ZodPipeline;
var ZodReadonly;
var late;
var ZodFirstPartyTypeKind;
var instanceOfType;
var stringType;
var numberType;
var nanType;
var bigIntType;
var booleanType;
var dateType;
var symbolType;
var undefinedType;
var nullType;
var anyType;
var unknownType;
var neverType;
var voidType;
var arrayType;
var objectType;
var strictObjectType;
var unionType;
var discriminatedUnionType;
var intersectionType;
var tupleType;
var recordType;
var mapType;
var setType;
var functionType;
var lazyType;
var literalType;
var enumType;
var nativeEnumType;
var promiseType;
var effectsType;
var optionalType;
var nullableType;
var preprocessType;
var pipelineType;
var ostring;
var onumber;
var oboolean;
var coerce;
var NEVER;
var z;
var init_lib = __esm({
  "../../node_modules/.pnpm/zod@3.23.8/node_modules/zod/lib/index.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    (function(util2) {
      util2.assertEqual = (val) => val;
      function assertIs(_arg) {
      }
      util2.assertIs = assertIs;
      function assertNever(_x) {
        throw new Error();
      }
      util2.assertNever = assertNever;
      util2.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
          obj[item] = item;
        }
        return obj;
      };
      util2.getValidEnumValues = (obj) => {
        const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
          filtered[k] = obj[k];
        }
        return util2.objectValues(filtered);
      };
      util2.objectValues = (obj) => {
        return util2.objectKeys(obj).map(function(e) {
          return obj[e];
        });
      };
      util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
        const keys = [];
        for (const key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
            keys.push(key);
          }
        }
        return keys;
      };
      util2.find = (arr, checker) => {
        for (const item of arr) {
          if (checker(item))
            return item;
        }
        return void 0;
      };
      util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
      function joinValues(array, separator = " | ") {
        return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
      }
      util2.joinValues = joinValues;
      util2.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
    })(util || (util = {}));
    (function(objectUtil2) {
      objectUtil2.mergeShapes = (first, second) => {
        return {
          ...first,
          ...second
          // second overwrites first
        };
      };
    })(objectUtil || (objectUtil = {}));
    ZodParsedType = util.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]);
    getParsedType = (data) => {
      const t2 = typeof data;
      switch (t2) {
        case "undefined":
          return ZodParsedType.undefined;
        case "string":
          return ZodParsedType.string;
        case "number":
          return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
          return ZodParsedType.boolean;
        case "function":
          return ZodParsedType.function;
        case "bigint":
          return ZodParsedType.bigint;
        case "symbol":
          return ZodParsedType.symbol;
        case "object":
          if (Array.isArray(data)) {
            return ZodParsedType.array;
          }
          if (data === null) {
            return ZodParsedType.null;
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return ZodParsedType.promise;
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return ZodParsedType.map;
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return ZodParsedType.set;
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return ZodParsedType.date;
          }
          return ZodParsedType.object;
        default:
          return ZodParsedType.unknown;
      }
    };
    ZodIssueCode = util.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of",
      "not_finite"
    ]);
    quotelessJson = (obj) => {
      const json = JSON.stringify(obj, null, 2);
      return json.replace(/"([^"]+)":/g, "$1:");
    };
    ZodError = class extends Error {
      constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
          this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
          this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(this, actualProto);
        } else {
          this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
      }
      get errors() {
        return this.issues;
      }
      format(_mapper) {
        const mapper = _mapper || function(issue) {
          return issue.message;
        };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
          for (const issue of error.issues) {
            if (issue.code === "invalid_union") {
              issue.unionErrors.map(processError);
            } else if (issue.code === "invalid_return_type") {
              processError(issue.returnTypeError);
            } else if (issue.code === "invalid_arguments") {
              processError(issue.argumentsError);
            } else if (issue.path.length === 0) {
              fieldErrors._errors.push(mapper(issue));
            } else {
              let curr = fieldErrors;
              let i = 0;
              while (i < issue.path.length) {
                const el = issue.path[i];
                const terminal = i === issue.path.length - 1;
                if (!terminal) {
                  curr[el] = curr[el] || { _errors: [] };
                } else {
                  curr[el] = curr[el] || { _errors: [] };
                  curr[el]._errors.push(mapper(issue));
                }
                curr = curr[el];
                i++;
              }
            }
          }
        };
        processError(this);
        return fieldErrors;
      }
      static assert(value) {
        if (!(value instanceof ZodError)) {
          throw new Error(`Not a ZodError: ${value}`);
        }
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
          if (sub.path.length > 0) {
            fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
            fieldErrors[sub.path[0]].push(mapper(sub));
          } else {
            formErrors.push(mapper(sub));
          }
        }
        return { formErrors, fieldErrors };
      }
      get formErrors() {
        return this.flatten();
      }
    };
    ZodError.create = (issues) => {
      const error = new ZodError(issues);
      return error;
    };
    errorMap = (issue, _ctx) => {
      let message;
      switch (issue.code) {
        case ZodIssueCode.invalid_type:
          if (issue.received === ZodParsedType.undefined) {
            message = "Required";
          } else {
            message = `Expected ${issue.expected}, received ${issue.received}`;
          }
          break;
        case ZodIssueCode.invalid_literal:
          message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
          break;
        case ZodIssueCode.unrecognized_keys:
          message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
          break;
        case ZodIssueCode.invalid_union:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_union_discriminator:
          message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
          break;
        case ZodIssueCode.invalid_enum_value:
          message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
          break;
        case ZodIssueCode.invalid_arguments:
          message = `Invalid function arguments`;
          break;
        case ZodIssueCode.invalid_return_type:
          message = `Invalid function return type`;
          break;
        case ZodIssueCode.invalid_date:
          message = `Invalid date`;
          break;
        case ZodIssueCode.invalid_string:
          if (typeof issue.validation === "object") {
            if ("includes" in issue.validation) {
              message = `Invalid input: must include "${issue.validation.includes}"`;
              if (typeof issue.validation.position === "number") {
                message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
              }
            } else if ("startsWith" in issue.validation) {
              message = `Invalid input: must start with "${issue.validation.startsWith}"`;
            } else if ("endsWith" in issue.validation) {
              message = `Invalid input: must end with "${issue.validation.endsWith}"`;
            } else {
              util.assertNever(issue.validation);
            }
          } else if (issue.validation !== "regex") {
            message = `Invalid ${issue.validation}`;
          } else {
            message = "Invalid";
          }
          break;
        case ZodIssueCode.too_small:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.too_big:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "bigint")
            message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.custom:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_intersection_types:
          message = `Intersection results could not be merged`;
          break;
        case ZodIssueCode.not_multiple_of:
          message = `Number must be a multiple of ${issue.multipleOf}`;
          break;
        case ZodIssueCode.not_finite:
          message = "Number must be finite";
          break;
        default:
          message = _ctx.defaultError;
          util.assertNever(issue);
      }
      return { message };
    };
    overrideErrorMap = errorMap;
    makeIssue = (params) => {
      const { data, path, errorMaps, issueData } = params;
      const fullPath = [...path, ...issueData.path || []];
      const fullIssue = {
        ...issueData,
        path: fullPath
      };
      if (issueData.message !== void 0) {
        return {
          ...issueData,
          path: fullPath,
          message: issueData.message
        };
      }
      let errorMessage = "";
      const maps = errorMaps.filter((m) => !!m).slice().reverse();
      for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
      }
      return {
        ...issueData,
        path: fullPath,
        message: errorMessage
      };
    };
    EMPTY_PATH = [];
    ParseStatus = class {
      constructor() {
        this.value = "valid";
      }
      dirty() {
        if (this.value === "valid")
          this.value = "dirty";
      }
      abort() {
        if (this.value !== "aborted")
          this.value = "aborted";
      }
      static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
          if (s.status === "aborted")
            return INVALID;
          if (s.status === "dirty")
            status.dirty();
          arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
      }
      static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value
          });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
      }
      static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
          const { key, value } = pair;
          if (key.status === "aborted")
            return INVALID;
          if (value.status === "aborted")
            return INVALID;
          if (key.status === "dirty")
            status.dirty();
          if (value.status === "dirty")
            status.dirty();
          if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
            finalObject[key.value] = value.value;
          }
        }
        return { status: status.value, value: finalObject };
      }
    };
    INVALID = Object.freeze({
      status: "aborted"
    });
    DIRTY = (value) => ({ status: "dirty", value });
    OK = (value) => ({ status: "valid", value });
    isAborted = (x) => x.status === "aborted";
    isDirty = (x) => x.status === "dirty";
    isValid = (x) => x.status === "valid";
    isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
    (function(errorUtil2) {
      errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
      errorUtil2.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
    })(errorUtil || (errorUtil = {}));
    ParseInputLazyPath = class {
      constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
      }
      get path() {
        if (!this._cachedPath.length) {
          if (this._key instanceof Array) {
            this._cachedPath.push(...this._path, ...this._key);
          } else {
            this._cachedPath.push(...this._path, this._key);
          }
        }
        return this._cachedPath;
      }
    };
    handleResult = (ctx, result) => {
      if (isValid(result)) {
        return { success: true, data: result.value };
      } else {
        if (!ctx.common.issues.length) {
          throw new Error("Validation failed but no issues detected.");
        }
        return {
          success: false,
          get error() {
            if (this._error)
              return this._error;
            const error = new ZodError(ctx.common.issues);
            this._error = error;
            return this._error;
          }
        };
      }
    };
    ZodType = class {
      constructor(def) {
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
      }
      get description() {
        return this._def.description;
      }
      _getType(input) {
        return getParsedType(input.data);
      }
      _getOrReturnCtx(input, ctx) {
        return ctx || {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        };
      }
      _processInputParams(input) {
        return {
          status: new ParseStatus(),
          ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
          }
        };
      }
      _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
          throw new Error("Synchronous parse encountered promise.");
        }
        return result;
      }
      _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
      }
      parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      safeParse(data, params) {
        var _a111;
        const ctx = {
          common: {
            issues: [],
            async: (_a111 = params === null || params === void 0 ? void 0 : params.async) !== null && _a111 !== void 0 ? _a111 : false,
            contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap
          },
          path: (params === null || params === void 0 ? void 0 : params.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
      }
      async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      async safeParseAsync(data, params) {
        const ctx = {
          common: {
            issues: [],
            contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
            async: true
          },
          path: (params === null || params === void 0 ? void 0 : params.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
      }
      refine(check, message) {
        const getIssueProperties = (val) => {
          if (typeof message === "string" || typeof message === "undefined") {
            return { message };
          } else if (typeof message === "function") {
            return message(val);
          } else {
            return message;
          }
        };
        return this._refinement((val, ctx) => {
          const result = check(val);
          const setError = () => ctx.addIssue({
            code: ZodIssueCode.custom,
            ...getIssueProperties(val)
          });
          if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then((data) => {
              if (!data) {
                setError();
                return false;
              } else {
                return true;
              }
            });
          }
          if (!result) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
          if (!check(val)) {
            ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
            return false;
          } else {
            return true;
          }
        });
      }
      _refinement(refinement) {
        return new ZodEffects({
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "refinement", refinement }
        });
      }
      superRefine(refinement) {
        return this._refinement(refinement);
      }
      optional() {
        return ZodOptional.create(this, this._def);
      }
      nullable() {
        return ZodNullable.create(this, this._def);
      }
      nullish() {
        return this.nullable().optional();
      }
      array() {
        return ZodArray.create(this, this._def);
      }
      promise() {
        return ZodPromise.create(this, this._def);
      }
      or(option) {
        return ZodUnion.create([this, option], this._def);
      }
      and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
      }
      transform(transform) {
        return new ZodEffects({
          ...processCreateParams(this._def),
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "transform", transform }
        });
      }
      default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
          ...processCreateParams(this._def),
          innerType: this,
          defaultValue: defaultValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodDefault
        });
      }
      brand() {
        return new ZodBranded({
          typeName: ZodFirstPartyTypeKind.ZodBranded,
          type: this,
          ...processCreateParams(this._def)
        });
      }
      catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
          ...processCreateParams(this._def),
          innerType: this,
          catchValue: catchValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodCatch
        });
      }
      describe(description) {
        const This = this.constructor;
        return new This({
          ...this._def,
          description
        });
      }
      pipe(target) {
        return ZodPipeline.create(this, target);
      }
      readonly() {
        return ZodReadonly.create(this);
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    };
    cuidRegex = /^c[^\s-]{8,}$/i;
    cuid2Regex = /^[0-9a-z]+$/;
    ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
    nanoidRegex = /^[a-z0-9_-]{21}$/i;
    durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
    base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
    dateRegex = new RegExp(`^${dateRegexSource}$`);
    ZodString = class extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.string,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.length < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.length > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "length") {
            const tooBig = input.data.length > check.value;
            const tooSmall = input.data.length < check.value;
            if (tooBig || tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              if (tooBig) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              } else if (tooSmall) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              }
              status.dirty();
            }
          } else if (check.kind === "email") {
            if (!emailRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "email",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "emoji") {
            if (!emojiRegex) {
              emojiRegex = new RegExp(_emojiRegex, "u");
            }
            if (!emojiRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "emoji",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "uuid") {
            if (!uuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "uuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "nanoid") {
            if (!nanoidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "nanoid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid") {
            if (!cuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid2") {
            if (!cuid2Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid2",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ulid") {
            if (!ulidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ulid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "url") {
            try {
              new URL(input.data);
            } catch (_a111) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "regex") {
            check.regex.lastIndex = 0;
            const testResult = check.regex.test(input.data);
            if (!testResult) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "regex",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "trim") {
            input.data = input.data.trim();
          } else if (check.kind === "includes") {
            if (!input.data.includes(check.value, check.position)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { includes: check.value, position: check.position },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "toLowerCase") {
            input.data = input.data.toLowerCase();
          } else if (check.kind === "toUpperCase") {
            input.data = input.data.toUpperCase();
          } else if (check.kind === "startsWith") {
            if (!input.data.startsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { startsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "endsWith") {
            if (!input.data.endsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { endsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "datetime") {
            const regex = datetimeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "datetime",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "date") {
            const regex = dateRegex;
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "date",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "time") {
            const regex = timeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "time",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "duration") {
            if (!durationRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "duration",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ip") {
            if (!isValidIP(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ip",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64") {
            if (!base64Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
          validation,
          code: ZodIssueCode.invalid_string,
          ...errorUtil.errToObj(message)
        });
      }
      _addCheck(check) {
        return new ZodString({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
      }
      url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
      }
      emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
      }
      uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
      }
      nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
      }
      cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
      }
      cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
      }
      ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
      }
      base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
      }
      ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
      }
      datetime(options) {
        var _a111, _b;
        if (typeof options === "string") {
          return this._addCheck({
            kind: "datetime",
            precision: null,
            offset: false,
            local: false,
            message: options
          });
        }
        return this._addCheck({
          kind: "datetime",
          precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
          offset: (_a111 = options === null || options === void 0 ? void 0 : options.offset) !== null && _a111 !== void 0 ? _a111 : false,
          local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,
          ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
        });
      }
      date(message) {
        return this._addCheck({ kind: "date", message });
      }
      time(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "time",
            precision: null,
            message: options
          });
        }
        return this._addCheck({
          kind: "time",
          precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
          ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
        });
      }
      duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
      }
      regex(regex, message) {
        return this._addCheck({
          kind: "regex",
          regex,
          ...errorUtil.errToObj(message)
        });
      }
      includes(value, options) {
        return this._addCheck({
          kind: "includes",
          value,
          position: options === null || options === void 0 ? void 0 : options.position,
          ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
        });
      }
      startsWith(value, message) {
        return this._addCheck({
          kind: "startsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      endsWith(value, message) {
        return this._addCheck({
          kind: "endsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      min(minLength, message) {
        return this._addCheck({
          kind: "min",
          value: minLength,
          ...errorUtil.errToObj(message)
        });
      }
      max(maxLength, message) {
        return this._addCheck({
          kind: "max",
          value: maxLength,
          ...errorUtil.errToObj(message)
        });
      }
      length(len, message) {
        return this._addCheck({
          kind: "length",
          value: len,
          ...errorUtil.errToObj(message)
        });
      }
      /**
       * @deprecated Use z.string().min(1) instead.
       * @see {@link ZodString.min}
       */
      nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
      }
      trim() {
        return new ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      toLowerCase() {
        return new ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toLowerCase" }]
        });
      }
      toUpperCase() {
        return new ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toUpperCase" }]
        });
      }
      get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
      }
      get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
      }
      get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
      }
      get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
      }
      get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
      }
      get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
      }
      get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
      }
      get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
      }
      get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
      }
      get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
      }
      get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
      }
      get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
      }
      get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
      }
      get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodString.create = (params) => {
      var _a111;
      return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: (_a111 = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a111 !== void 0 ? _a111 : false,
        ...processCreateParams(params)
      });
    };
    ZodNumber = class extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.number,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "int") {
            if (!util.isInteger(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: "integer",
                received: "float",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (floatSafeRemainder(input.data, check.value) !== 0) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "finite") {
            if (!Number.isFinite(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_finite,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new ZodNumber({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      int(message) {
        return this._addCheck({
          kind: "int",
          message: errorUtil.toString(message)
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      finite(message) {
        return this._addCheck({
          kind: "finite",
          message: errorUtil.toString(message)
        });
      }
      safe(message) {
        return this._addCheck({
          kind: "min",
          inclusive: true,
          value: Number.MIN_SAFE_INTEGER,
          message: errorUtil.toString(message)
        })._addCheck({
          kind: "max",
          inclusive: true,
          value: Number.MAX_SAFE_INTEGER,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
      get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
      }
      get isFinite() {
        let max = null, min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
            return true;
          } else if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          } else if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return Number.isFinite(min) && Number.isFinite(max);
      }
    };
    ZodNumber.create = (params) => {
      return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params)
      });
    };
    ZodBigInt = class extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = BigInt(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.bigint,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                type: "bigint",
                minimum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                type: "bigint",
                maximum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (input.data % check.value !== BigInt(0)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new ZodBigInt({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new ZodBigInt({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodBigInt.create = (params) => {
      var _a111;
      return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: (_a111 = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a111 !== void 0 ? _a111 : false,
        ...processCreateParams(params)
      });
    };
    ZodBoolean = class extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.boolean,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodBoolean.create = (params) => {
      return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params)
      });
    };
    ZodDate = class extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.date,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        if (isNaN(input.data.getTime())) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_date
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.getTime() < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                message: check.message,
                inclusive: true,
                exact: false,
                minimum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.getTime() > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                message: check.message,
                inclusive: true,
                exact: false,
                maximum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return {
          status: status.value,
          value: new Date(input.data.getTime())
        };
      }
      _addCheck(check) {
        return new ZodDate({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      min(minDate, message) {
        return this._addCheck({
          kind: "min",
          value: minDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      max(maxDate, message) {
        return this._addCheck({
          kind: "max",
          value: maxDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min != null ? new Date(min) : null;
      }
      get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max != null ? new Date(max) : null;
      }
    };
    ZodDate.create = (params) => {
      return new ZodDate({
        checks: [],
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params)
      });
    };
    ZodSymbol = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.symbol,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodSymbol.create = (params) => {
      return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params)
      });
    };
    ZodUndefined = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.undefined,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodUndefined.create = (params) => {
      return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params)
      });
    };
    ZodNull = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.null,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodNull.create = (params) => {
      return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params)
      });
    };
    ZodAny = class extends ZodType {
      constructor() {
        super(...arguments);
        this._any = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodAny.create = (params) => {
      return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params)
      });
    };
    ZodUnknown = class extends ZodType {
      constructor() {
        super(...arguments);
        this._unknown = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodUnknown.create = (params) => {
      return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params)
      });
    };
    ZodNever = class extends ZodType {
      _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.never,
          received: ctx.parsedType
        });
        return INVALID;
      }
    };
    ZodNever.create = (params) => {
      return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params)
      });
    };
    ZodVoid = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.void,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodVoid.create = (params) => {
      return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params)
      });
    };
    ZodArray = class extends ZodType {
      _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (def.exactLength !== null) {
          const tooBig = ctx.data.length > def.exactLength.value;
          const tooSmall = ctx.data.length < def.exactLength.value;
          if (tooBig || tooSmall) {
            addIssueToContext(ctx, {
              code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
              minimum: tooSmall ? def.exactLength.value : void 0,
              maximum: tooBig ? def.exactLength.value : void 0,
              type: "array",
              inclusive: true,
              exact: true,
              message: def.exactLength.message
            });
            status.dirty();
          }
        }
        if (def.minLength !== null) {
          if (ctx.data.length < def.minLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.minLength.message
            });
            status.dirty();
          }
        }
        if (def.maxLength !== null) {
          if (ctx.data.length > def.maxLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.maxLength.message
            });
            status.dirty();
          }
        }
        if (ctx.common.async) {
          return Promise.all([...ctx.data].map((item, i) => {
            return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
          })).then((result2) => {
            return ParseStatus.mergeArray(status, result2);
          });
        }
        const result = [...ctx.data].map((item, i) => {
          return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
      }
      get element() {
        return this._def.type;
      }
      min(minLength, message) {
        return new ZodArray({
          ...this._def,
          minLength: { value: minLength, message: errorUtil.toString(message) }
        });
      }
      max(maxLength, message) {
        return new ZodArray({
          ...this._def,
          maxLength: { value: maxLength, message: errorUtil.toString(message) }
        });
      }
      length(len, message) {
        return new ZodArray({
          ...this._def,
          exactLength: { value: len, message: errorUtil.toString(message) }
        });
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodArray.create = (schema, params) => {
      return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params)
      });
    };
    ZodObject = class extends ZodType {
      constructor() {
        super(...arguments);
        this._cached = null;
        this.nonstrict = this.passthrough;
        this.augment = this.extend;
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        return this._cached = { shape, keys };
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
          for (const key in ctx.data) {
            if (!shapeKeys.includes(key)) {
              extraKeys.push(key);
            }
          }
        }
        const pairs = [];
        for (const key of shapeKeys) {
          const keyValidator = shape[key];
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (this._def.catchall instanceof ZodNever) {
          const unknownKeys = this._def.unknownKeys;
          if (unknownKeys === "passthrough") {
            for (const key of extraKeys) {
              pairs.push({
                key: { status: "valid", value: key },
                value: { status: "valid", value: ctx.data[key] }
              });
            }
          } else if (unknownKeys === "strict") {
            if (extraKeys.length > 0) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.unrecognized_keys,
                keys: extraKeys
              });
              status.dirty();
            }
          } else if (unknownKeys === "strip")
            ;
          else {
            throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
          }
        } else {
          const catchall = this._def.catchall;
          for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
              key: { status: "valid", value: key },
              value: catchall._parse(
                new ParseInputLazyPath(ctx, value, ctx.path, key)
                //, ctx.child(key), value, getParsedType(value)
              ),
              alwaysSet: key in ctx.data
            });
          }
        }
        if (ctx.common.async) {
          return Promise.resolve().then(async () => {
            const syncPairs = [];
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              syncPairs.push({
                key,
                value,
                alwaysSet: pair.alwaysSet
              });
            }
            return syncPairs;
          }).then((syncPairs) => {
            return ParseStatus.mergeObjectSync(status, syncPairs);
          });
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get shape() {
        return this._def.shape();
      }
      strict(message) {
        errorUtil.errToObj;
        return new ZodObject({
          ...this._def,
          unknownKeys: "strict",
          ...message !== void 0 ? {
            errorMap: (issue, ctx) => {
              var _a111, _b, _c, _d;
              const defaultError = (_c = (_b = (_a111 = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a111, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
              if (issue.code === "unrecognized_keys")
                return {
                  message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError
                };
              return {
                message: defaultError
              };
            }
          } : {}
        });
      }
      strip() {
        return new ZodObject({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new ZodObject({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      // const AugmentFactory =
      //   <Def extends ZodObjectDef>(def: Def) =>
      //   <Augmentation extends ZodRawShape>(
      //     augmentation: Augmentation
      //   ): ZodObject<
      //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
      //     Def["unknownKeys"],
      //     Def["catchall"]
      //   > => {
      //     return new ZodObject({
      //       ...def,
      //       shape: () => ({
      //         ...def.shape(),
      //         ...augmentation,
      //       }),
      //     }) as any;
      //   };
      extend(augmentation) {
        return new ZodObject({
          ...this._def,
          shape: () => ({
            ...this._def.shape(),
            ...augmentation
          })
        });
      }
      /**
       * Prior to zod@1.0.12 there was a bug in the
       * inferred type of merged objects. Please
       * upgrade if you are experiencing issues.
       */
      merge(merging) {
        const merged = new ZodObject({
          unknownKeys: merging._def.unknownKeys,
          catchall: merging._def.catchall,
          shape: () => ({
            ...this._def.shape(),
            ...merging._def.shape()
          }),
          typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
      }
      // merge<
      //   Incoming extends AnyZodObject,
      //   Augmentation extends Incoming["shape"],
      //   NewOutput extends {
      //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
      //       ? Augmentation[k]["_output"]
      //       : k extends keyof Output
      //       ? Output[k]
      //       : never;
      //   },
      //   NewInput extends {
      //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
      //       ? Augmentation[k]["_input"]
      //       : k extends keyof Input
      //       ? Input[k]
      //       : never;
      //   }
      // >(
      //   merging: Incoming
      // ): ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"],
      //   NewOutput,
      //   NewInput
      // > {
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      setKey(key, schema) {
        return this.augment({ [key]: schema });
      }
      // merge<Incoming extends AnyZodObject>(
      //   merging: Incoming
      // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
      // ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"]
      // > {
      //   // const mergedShape = objectUtil.mergeShapes(
      //   //   this._def.shape(),
      //   //   merging._def.shape()
      //   // );
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      catchall(index) {
        return new ZodObject({
          ...this._def,
          catchall: index
        });
      }
      pick(mask) {
        const shape = {};
        util.objectKeys(mask).forEach((key) => {
          if (mask[key] && this.shape[key]) {
            shape[key] = this.shape[key];
          }
        });
        return new ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      omit(mask) {
        const shape = {};
        util.objectKeys(this.shape).forEach((key) => {
          if (!mask[key]) {
            shape[key] = this.shape[key];
          }
        });
        return new ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      /**
       * @deprecated
       */
      deepPartial() {
        return deepPartialify(this);
      }
      partial(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
          const fieldSchema = this.shape[key];
          if (mask && !mask[key]) {
            newShape[key] = fieldSchema;
          } else {
            newShape[key] = fieldSchema.optional();
          }
        });
        return new ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      required(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
          if (mask && !mask[key]) {
            newShape[key] = this.shape[key];
          } else {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
              newField = newField._def.innerType;
            }
            newShape[key] = newField;
          }
        });
        return new ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      keyof() {
        return createZodEnum(util.objectKeys(this.shape));
      }
    };
    ZodObject.create = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.strictCreate = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.lazycreate = (shape, params) => {
      return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodUnion = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
          for (const result of results) {
            if (result.result.status === "valid") {
              return result.result;
            }
          }
          for (const result of results) {
            if (result.result.status === "dirty") {
              ctx.common.issues.push(...result.ctx.common.issues);
              return result.result;
            }
          }
          const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
        if (ctx.common.async) {
          return Promise.all(options.map(async (option) => {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: childCtx
              }),
              ctx: childCtx
            };
          })).then(handleResults);
        } else {
          let dirty = void 0;
          const issues = [];
          for (const option of options) {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            const result = option._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            });
            if (result.status === "valid") {
              return result;
            } else if (result.status === "dirty" && !dirty) {
              dirty = { result, ctx: childCtx };
            }
            if (childCtx.common.issues.length) {
              issues.push(childCtx.common.issues);
            }
          }
          if (dirty) {
            ctx.common.issues.push(...dirty.ctx.common.issues);
            return dirty.result;
          }
          const unionErrors = issues.map((issues2) => new ZodError(issues2));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
      }
      get options() {
        return this._def.options;
      }
    };
    ZodUnion.create = (types, params) => {
      return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params)
      });
    };
    getDiscriminator = (type) => {
      if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
      } else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
      } else if (type instanceof ZodLiteral) {
        return [type.value];
      } else if (type instanceof ZodEnum) {
        return type.options;
      } else if (type instanceof ZodNativeEnum) {
        return util.objectValues(type.enum);
      } else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
      } else if (type instanceof ZodUndefined) {
        return [void 0];
      } else if (type instanceof ZodNull) {
        return [null];
      } else if (type instanceof ZodOptional) {
        return [void 0, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
      } else {
        return [];
      }
    };
    ZodDiscriminatedUnion = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [discriminator]
          });
          return INVALID;
        }
        if (ctx.common.async) {
          return option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        } else {
          return option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        }
      }
      get discriminator() {
        return this._def.discriminator;
      }
      get options() {
        return this._def.options;
      }
      get optionsMap() {
        return this._def.optionsMap;
      }
      /**
       * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
       * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
       * have a different value for each object in the union.
       * @param discriminator the name of the discriminator property
       * @param types an array of object schemas
       * @param params
       */
      static create(discriminator, options, params) {
        const optionsMap = /* @__PURE__ */ new Map();
        for (const type of options) {
          const discriminatorValues = getDiscriminator(type.shape[discriminator]);
          if (!discriminatorValues.length) {
            throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
          }
          for (const value of discriminatorValues) {
            if (optionsMap.has(value)) {
              throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
            }
            optionsMap.set(value, type);
          }
        }
        return new ZodDiscriminatedUnion({
          typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
          discriminator,
          options,
          optionsMap,
          ...processCreateParams(params)
        });
      }
    };
    ZodIntersection = class extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
          if (isAborted(parsedLeft) || isAborted(parsedRight)) {
            return INVALID;
          }
          const merged = mergeValues(parsedLeft.value, parsedRight.value);
          if (!merged.valid) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_intersection_types
            });
            return INVALID;
          }
          if (isDirty(parsedLeft) || isDirty(parsedRight)) {
            status.dirty();
          }
          return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
          return Promise.all([
            this._def.left._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            }),
            this._def.right._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            })
          ]).then(([left, right]) => handleParsed(left, right));
        } else {
          return handleParsed(this._def.left._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }), this._def.right._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }));
        }
      }
    };
    ZodIntersection.create = (left, right, params) => {
      return new ZodIntersection({
        left,
        right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params)
      });
    };
    ZodTuple = class extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          status.dirty();
        }
        const items = [...ctx.data].map((item, itemIndex) => {
          const schema = this._def.items[itemIndex] || this._def.rest;
          if (!schema)
            return null;
          return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x) => !!x);
        if (ctx.common.async) {
          return Promise.all(items).then((results) => {
            return ParseStatus.mergeArray(status, results);
          });
        } else {
          return ParseStatus.mergeArray(status, items);
        }
      }
      get items() {
        return this._def.items;
      }
      rest(rest) {
        return new ZodTuple({
          ...this._def,
          rest
        });
      }
    };
    ZodTuple.create = (schemas, params) => {
      if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      }
      return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params)
      });
    };
    ZodRecord = class extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
          pairs.push({
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
            value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (ctx.common.async) {
          return ParseStatus.mergeObjectAsync(status, pairs);
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get element() {
        return this._def.valueType;
      }
      static create(first, second, third) {
        if (second instanceof ZodType) {
          return new ZodRecord({
            keyType: first,
            valueType: second,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(third)
          });
        }
        return new ZodRecord({
          keyType: ZodString.create(),
          valueType: first,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(second)
        });
      }
    };
    ZodMap = class extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.map,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
          return {
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
            value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
          };
        });
        if (ctx.common.async) {
          const finalMap = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              if (key.status === "aborted" || value.status === "aborted") {
                return INVALID;
              }
              if (key.status === "dirty" || value.status === "dirty") {
                status.dirty();
              }
              finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
          });
        } else {
          const finalMap = /* @__PURE__ */ new Map();
          for (const pair of pairs) {
            const key = pair.key;
            const value = pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        }
      }
    };
    ZodMap.create = (keyType, valueType, params) => {
      return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params)
      });
    };
    ZodSet = class extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.set,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
          if (ctx.data.size < def.minSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.minSize.message
            });
            status.dirty();
          }
        }
        if (def.maxSize !== null) {
          if (ctx.data.size > def.maxSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.maxSize.message
            });
            status.dirty();
          }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements2) {
          const parsedSet = /* @__PURE__ */ new Set();
          for (const element of elements2) {
            if (element.status === "aborted")
              return INVALID;
            if (element.status === "dirty")
              status.dirty();
            parsedSet.add(element.value);
          }
          return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
          return Promise.all(elements).then((elements2) => finalizeSet(elements2));
        } else {
          return finalizeSet(elements);
        }
      }
      min(minSize, message) {
        return new ZodSet({
          ...this._def,
          minSize: { value: minSize, message: errorUtil.toString(message) }
        });
      }
      max(maxSize, message) {
        return new ZodSet({
          ...this._def,
          maxSize: { value: maxSize, message: errorUtil.toString(message) }
        });
      }
      size(size, message) {
        return this.min(size, message).max(size, message);
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodSet.create = (valueType, params) => {
      return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params)
      });
    };
    ZodFunction = class extends ZodType {
      constructor() {
        super(...arguments);
        this.validate = this.implement;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.function,
            received: ctx.parsedType
          });
          return INVALID;
        }
        function makeArgsIssue(args, error) {
          return makeIssue({
            data: args,
            path: ctx.path,
            errorMaps: [
              ctx.common.contextualErrorMap,
              ctx.schemaErrorMap,
              getErrorMap(),
              errorMap
            ].filter((x) => !!x),
            issueData: {
              code: ZodIssueCode.invalid_arguments,
              argumentsError: error
            }
          });
        }
        function makeReturnsIssue(returns, error) {
          return makeIssue({
            data: returns,
            path: ctx.path,
            errorMaps: [
              ctx.common.contextualErrorMap,
              ctx.schemaErrorMap,
              getErrorMap(),
              errorMap
            ].filter((x) => !!x),
            issueData: {
              code: ZodIssueCode.invalid_return_type,
              returnTypeError: error
            }
          });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
          const me = this;
          return OK(async function(...args) {
            const error = new ZodError([]);
            const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
              error.addIssue(makeArgsIssue(args, e));
              throw error;
            });
            const result = await Reflect.apply(fn, this, parsedArgs);
            const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
              error.addIssue(makeReturnsIssue(result, e));
              throw error;
            });
            return parsedReturns;
          });
        } else {
          const me = this;
          return OK(function(...args) {
            const parsedArgs = me._def.args.safeParse(args, params);
            if (!parsedArgs.success) {
              throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
            }
            const result = Reflect.apply(fn, this, parsedArgs.data);
            const parsedReturns = me._def.returns.safeParse(result, params);
            if (!parsedReturns.success) {
              throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
            }
            return parsedReturns.data;
          });
        }
      }
      parameters() {
        return this._def.args;
      }
      returnType() {
        return this._def.returns;
      }
      args(...items) {
        return new ZodFunction({
          ...this._def,
          args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
      }
      returns(returnType) {
        return new ZodFunction({
          ...this._def,
          returns: returnType
        });
      }
      implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      static create(args, returns, params) {
        return new ZodFunction({
          args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
          returns: returns || ZodUnknown.create(),
          typeName: ZodFirstPartyTypeKind.ZodFunction,
          ...processCreateParams(params)
        });
      }
    };
    ZodLazy = class extends ZodType {
      get schema() {
        return this._def.getter();
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
      }
    };
    ZodLazy.create = (getter, params) => {
      return new ZodLazy({
        getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params)
      });
    };
    ZodLiteral = class extends ZodType {
      _parse(input) {
        if (input.data !== this._def.value) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_literal,
            expected: this._def.value
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
      get value() {
        return this._def.value;
      }
    };
    ZodLiteral.create = (value, params) => {
      return new ZodLiteral({
        value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params)
      });
    };
    ZodEnum = class extends ZodType {
      constructor() {
        super(...arguments);
        _ZodEnum_cache.set(this, void 0);
      }
      _parse(input) {
        if (typeof input.data !== "string") {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {
          __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      extract(values, newDef = this._def) {
        return ZodEnum.create(values, {
          ...this._def,
          ...newDef
        });
      }
      exclude(values, newDef = this._def) {
        return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
          ...this._def,
          ...newDef
        });
      }
    };
    _ZodEnum_cache = /* @__PURE__ */ new WeakMap();
    ZodEnum.create = createZodEnum;
    ZodNativeEnum = class extends ZodType {
      constructor() {
        super(...arguments);
        _ZodNativeEnum_cache.set(this, void 0);
      }
      _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {
          __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f");
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get enum() {
        return this._def.values;
      }
    };
    _ZodNativeEnum_cache = /* @__PURE__ */ new WeakMap();
    ZodNativeEnum.create = (values, params) => {
      return new ZodNativeEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params)
      });
    };
    ZodPromise = class extends ZodType {
      unwrap() {
        return this._def.type;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.promise,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
          return this._def.type.parseAsync(data, {
            path: ctx.path,
            errorMap: ctx.common.contextualErrorMap
          });
        }));
      }
    };
    ZodPromise.create = (schema, params) => {
      return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params)
      });
    };
    ZodEffects = class extends ZodType {
      innerType() {
        return this._def.schema;
      }
      sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
          addIssue: (arg) => {
            addIssueToContext(ctx, arg);
            if (arg.fatal) {
              status.abort();
            } else {
              status.dirty();
            }
          },
          get path() {
            return ctx.path;
          }
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
          const processed = effect.transform(ctx.data, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(processed).then(async (processed2) => {
              if (status.value === "aborted")
                return INVALID;
              const result = await this._def.schema._parseAsync({
                data: processed2,
                path: ctx.path,
                parent: ctx
              });
              if (result.status === "aborted")
                return INVALID;
              if (result.status === "dirty")
                return DIRTY(result.value);
              if (status.value === "dirty")
                return DIRTY(result.value);
              return result;
            });
          } else {
            if (status.value === "aborted")
              return INVALID;
            const result = this._def.schema._parseSync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          }
        }
        if (effect.type === "refinement") {
          const executeRefinement = (acc) => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) {
              return Promise.resolve(result);
            }
            if (result instanceof Promise) {
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            }
            return acc;
          };
          if (ctx.common.async === false) {
            const inner = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            executeRefinement(inner.value);
            return { status: status.value, value: inner.value };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
              if (inner.status === "aborted")
                return INVALID;
              if (inner.status === "dirty")
                status.dirty();
              return executeRefinement(inner.value).then(() => {
                return { status: status.value, value: inner.value };
              });
            });
          }
        }
        if (effect.type === "transform") {
          if (ctx.common.async === false) {
            const base = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (!isValid(base))
              return base;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) {
              throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
            }
            return { status: status.value, value: result };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
              if (!isValid(base))
                return base;
              return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
            });
          }
        }
        util.assertNever(effect);
      }
    };
    ZodEffects.create = (schema, effect, params) => {
      return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params)
      });
    };
    ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
      return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params)
      });
    };
    ZodOptional = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
          return OK(void 0);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodOptional.create = (type, params) => {
      return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params)
      });
    };
    ZodNullable = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
          return OK(null);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodNullable.create = (type, params) => {
      return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params)
      });
    };
    ZodDefault = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
          data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    };
    ZodDefault.create = (type, params) => {
      return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params)
      });
    };
    ZodCatch = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const newCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          }
        };
        const result = this._def.innerType._parse({
          data: newCtx.data,
          path: newCtx.path,
          parent: {
            ...newCtx
          }
        });
        if (isAsync(result)) {
          return result.then((result2) => {
            return {
              status: "valid",
              value: result2.status === "valid" ? result2.value : this._def.catchValue({
                get error() {
                  return new ZodError(newCtx.common.issues);
                },
                input: newCtx.data
              })
            };
          });
        } else {
          return {
            status: "valid",
            value: result.status === "valid" ? result.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        }
      }
      removeCatch() {
        return this._def.innerType;
      }
    };
    ZodCatch.create = (type, params) => {
      return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params)
      });
    };
    ZodNaN = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.nan,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
    };
    ZodNaN.create = (params) => {
      return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params)
      });
    };
    BRAND = Symbol("zod_brand");
    ZodBranded = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      unwrap() {
        return this._def.type;
      }
    };
    ZodPipeline = class extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
          const handleAsync = async () => {
            const inResult = await this._def.in._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inResult.status === "aborted")
              return INVALID;
            if (inResult.status === "dirty") {
              status.dirty();
              return DIRTY(inResult.value);
            } else {
              return this._def.out._parseAsync({
                data: inResult.value,
                path: ctx.path,
                parent: ctx
              });
            }
          };
          return handleAsync();
        } else {
          const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return {
              status: "dirty",
              value: inResult.value
            };
          } else {
            return this._def.out._parseSync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        }
      }
      static create(a, b) {
        return new ZodPipeline({
          in: a,
          out: b,
          typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
      }
    };
    ZodReadonly = class extends ZodType {
      _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
          if (isValid(data)) {
            data.value = Object.freeze(data.value);
          }
          return data;
        };
        return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodReadonly.create = (type, params) => {
      return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params)
      });
    };
    late = {
      object: ZodObject.lazycreate
    };
    (function(ZodFirstPartyTypeKind2) {
      ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
      ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
      ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
      ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
      ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
      ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
      ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
      ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
      ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
      ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
      ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
      ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
      ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
      ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
      ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
      ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
      ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
      ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
      ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
      ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
      ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
      ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
      ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
      ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
      ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
      ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
      ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
      ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
      ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
      ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
      ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
      ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
      ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
      ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
      ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
      ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
    })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
    instanceOfType = (cls, params = {
      message: `Input not instance of ${cls.name}`
    }) => custom((data) => data instanceof cls, params);
    stringType = ZodString.create;
    numberType = ZodNumber.create;
    nanType = ZodNaN.create;
    bigIntType = ZodBigInt.create;
    booleanType = ZodBoolean.create;
    dateType = ZodDate.create;
    symbolType = ZodSymbol.create;
    undefinedType = ZodUndefined.create;
    nullType = ZodNull.create;
    anyType = ZodAny.create;
    unknownType = ZodUnknown.create;
    neverType = ZodNever.create;
    voidType = ZodVoid.create;
    arrayType = ZodArray.create;
    objectType = ZodObject.create;
    strictObjectType = ZodObject.strictCreate;
    unionType = ZodUnion.create;
    discriminatedUnionType = ZodDiscriminatedUnion.create;
    intersectionType = ZodIntersection.create;
    tupleType = ZodTuple.create;
    recordType = ZodRecord.create;
    mapType = ZodMap.create;
    setType = ZodSet.create;
    functionType = ZodFunction.create;
    lazyType = ZodLazy.create;
    literalType = ZodLiteral.create;
    enumType = ZodEnum.create;
    nativeEnumType = ZodNativeEnum.create;
    promiseType = ZodPromise.create;
    effectsType = ZodEffects.create;
    optionalType = ZodOptional.create;
    nullableType = ZodNullable.create;
    preprocessType = ZodEffects.createWithPreprocess;
    pipelineType = ZodPipeline.create;
    ostring = () => stringType().optional();
    onumber = () => numberType().optional();
    oboolean = () => booleanType().optional();
    coerce = {
      string: (arg) => ZodString.create({ ...arg, coerce: true }),
      number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
      boolean: (arg) => ZodBoolean.create({
        ...arg,
        coerce: true
      }),
      bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
      date: (arg) => ZodDate.create({ ...arg, coerce: true })
    };
    NEVER = INVALID;
    z = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      defaultErrorMap: errorMap,
      setErrorMap,
      getErrorMap,
      makeIssue,
      EMPTY_PATH,
      addIssueToContext,
      ParseStatus,
      INVALID,
      DIRTY,
      OK,
      isAborted,
      isDirty,
      isValid,
      isAsync,
      get util() {
        return util;
      },
      get objectUtil() {
        return objectUtil;
      },
      ZodParsedType,
      getParsedType,
      ZodType,
      datetimeRegex,
      ZodString,
      ZodNumber,
      ZodBigInt,
      ZodBoolean,
      ZodDate,
      ZodSymbol,
      ZodUndefined,
      ZodNull,
      ZodAny,
      ZodUnknown,
      ZodNever,
      ZodVoid,
      ZodArray,
      ZodObject,
      ZodUnion,
      ZodDiscriminatedUnion,
      ZodIntersection,
      ZodTuple,
      ZodRecord,
      ZodMap,
      ZodSet,
      ZodFunction,
      ZodLazy,
      ZodLiteral,
      ZodEnum,
      ZodNativeEnum,
      ZodPromise,
      ZodEffects,
      ZodTransformer: ZodEffects,
      ZodOptional,
      ZodNullable,
      ZodDefault,
      ZodCatch,
      ZodNaN,
      BRAND,
      ZodBranded,
      ZodPipeline,
      ZodReadonly,
      custom,
      Schema: ZodType,
      ZodSchema: ZodType,
      late,
      get ZodFirstPartyTypeKind() {
        return ZodFirstPartyTypeKind;
      },
      coerce,
      any: anyType,
      array: arrayType,
      bigint: bigIntType,
      boolean: booleanType,
      date: dateType,
      discriminatedUnion: discriminatedUnionType,
      effect: effectsType,
      "enum": enumType,
      "function": functionType,
      "instanceof": instanceOfType,
      intersection: intersectionType,
      lazy: lazyType,
      literal: literalType,
      map: mapType,
      nan: nanType,
      nativeEnum: nativeEnumType,
      never: neverType,
      "null": nullType,
      nullable: nullableType,
      number: numberType,
      object: objectType,
      oboolean,
      onumber,
      optional: optionalType,
      ostring,
      pipeline: pipelineType,
      preprocess: preprocessType,
      promise: promiseType,
      record: recordType,
      set: setType,
      strictObject: strictObjectType,
      string: stringType,
      symbol: symbolType,
      transformer: effectsType,
      tuple: tupleType,
      "undefined": undefinedType,
      union: unionType,
      unknown: unknownType,
      "void": voidType,
      NEVER,
      ZodIssueCode,
      quotelessJson,
      ZodError
    });
  }
});
function initEnvs(envs) {
  validatedEnv = envSchema.parse(envs);
}
function getAllEnvs() {
  if (!validatedEnv) {
    throw new Error("Environment variables have not been initialised");
  }
  return validatedEnv;
}
var d1DatabaseSchema;
var envSchema;
var validatedEnv;
var init_envs = __esm({
  "../dist/config/envs.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_lib();
    d1DatabaseSchema = z.custom((value) => typeof value === "object" && value !== null && "prepare" in value, { message: "Invalid D1Database instance" });
    envSchema = z.object({
      ZITADEL_CLIENT_ID: z.string(),
      ZITADEL_CLIENT_SECRET: z.string(),
      ZITADEL_INTROSPECTION_ENDPOINT: z.string(),
      DB: d1DatabaseSchema
    });
    validatedEnv = null;
  }
});
function createMiddlewareFactory() {
  function createMiddlewareInner(middlewares) {
    return {
      _middlewares: middlewares,
      unstable_pipe(middlewareBuilderOrFn) {
        const pipedMiddleware = "_middlewares" in middlewareBuilderOrFn ? middlewareBuilderOrFn._middlewares : [
          middlewareBuilderOrFn
        ];
        return createMiddlewareInner([
          ...middlewares,
          ...pipedMiddleware
        ]);
      }
    };
  }
  function createMiddleware(fn) {
    return createMiddlewareInner([
      fn
    ]);
  }
  return createMiddleware;
}
function createInputMiddleware(parse3) {
  const inputMiddleware = async function inputValidatorMiddleware(opts) {
    let parsedInput;
    const rawInput = await opts.getRawInput();
    try {
      parsedInput = await parse3(rawInput);
    } catch (cause) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        cause
      });
    }
    const combinedInput = isObject(opts.input) && isObject(parsedInput) ? {
      ...opts.input,
      ...parsedInput
    } : parsedInput;
    return opts.next({
      input: combinedInput
    });
  };
  inputMiddleware._type = "input";
  return inputMiddleware;
}
function createOutputMiddleware(parse3) {
  const outputMiddleware = async function outputValidatorMiddleware({ next }) {
    const result = await next();
    if (!result.ok) {
      return result;
    }
    try {
      const data = await parse3(result.data);
      return {
        ...result,
        data
      };
    } catch (cause) {
      throw new TRPCError({
        message: "Output validation failed",
        code: "INTERNAL_SERVER_ERROR",
        cause
      });
    }
  };
  outputMiddleware._type = "output";
  return outputMiddleware;
}
var middlewareMarker;
var init_middleware = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/middleware.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_TRPCError();
    init_utils3();
    middlewareMarker = "middlewareMarker";
  }
});
function getParseFn(procedureParser) {
  const parser = procedureParser;
  if (typeof parser === "function") {
    return parser;
  }
  if (typeof parser.parseAsync === "function") {
    return parser.parseAsync.bind(parser);
  }
  if (typeof parser.parse === "function") {
    return parser.parse.bind(parser);
  }
  if (typeof parser.validateSync === "function") {
    return parser.validateSync.bind(parser);
  }
  if (typeof parser.create === "function") {
    return parser.create.bind(parser);
  }
  if (typeof parser.assert === "function") {
    return (value) => {
      parser.assert(value);
      return value;
    };
  }
  throw new Error("Could not find a validator fn");
}
var init_parser = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/parser.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
function createNewBuilder(def1, def2) {
  const { middlewares = [], inputs, meta, ...rest } = def2;
  return createBuilder({
    ...mergeWithoutOverrides(def1, rest),
    inputs: [
      ...def1.inputs,
      ...inputs ?? []
    ],
    middlewares: [
      ...def1.middlewares,
      ...middlewares
    ],
    meta: def1.meta && meta ? {
      ...def1.meta,
      ...meta
    } : meta ?? def1.meta
  });
}
function createBuilder(initDef = {}) {
  const _def = {
    procedure: true,
    inputs: [],
    middlewares: [],
    ...initDef
  };
  const builder = {
    _def,
    input(input) {
      const parser = getParseFn(input);
      return createNewBuilder(_def, {
        inputs: [
          input
        ],
        middlewares: [
          createInputMiddleware(parser)
        ]
      });
    },
    output(output) {
      const parser = getParseFn(output);
      return createNewBuilder(_def, {
        output,
        middlewares: [
          createOutputMiddleware(parser)
        ]
      });
    },
    meta(meta) {
      return createNewBuilder(_def, {
        meta
      });
    },
    use(middlewareBuilderOrFn) {
      const middlewares = "_middlewares" in middlewareBuilderOrFn ? middlewareBuilderOrFn._middlewares : [
        middlewareBuilderOrFn
      ];
      return createNewBuilder(_def, {
        middlewares
      });
    },
    unstable_concat(builder2) {
      return createNewBuilder(_def, builder2._def);
    },
    query(resolver) {
      return createResolver({
        ..._def,
        type: "query"
      }, resolver);
    },
    mutation(resolver) {
      return createResolver({
        ..._def,
        type: "mutation"
      }, resolver);
    },
    subscription(resolver) {
      return createResolver({
        ..._def,
        type: "subscription"
      }, resolver);
    },
    experimental_caller(caller) {
      return createNewBuilder(_def, {
        caller
      });
    }
  };
  return builder;
}
function createResolver(_defIn, resolver) {
  const finalBuilder = createNewBuilder(_defIn, {
    resolver,
    middlewares: [
      async function resolveMiddleware(opts) {
        const data = await resolver(opts);
        return {
          marker: middlewareMarker,
          ok: true,
          data,
          ctx: opts.ctx
        };
      }
    ]
  });
  const _def = {
    ...finalBuilder._def,
    type: _defIn.type,
    experimental_caller: Boolean(finalBuilder._def.caller),
    meta: finalBuilder._def.meta,
    $types: null
  };
  const invoke = createProcedureCaller(finalBuilder._def);
  const callerOverride = finalBuilder._def.caller;
  if (!callerOverride) {
    return invoke;
  }
  const callerWrapper = async (...args) => {
    return await callerOverride({
      args,
      invoke,
      _def
    });
  };
  callerWrapper._def = _def;
  return callerWrapper;
}
function createProcedureCaller(_def) {
  async function procedure(opts) {
    if (!opts || !("getRawInput" in opts)) {
      throw new Error(codeblock);
    }
    async function callRecursive(callOpts = {
      index: 0,
      ctx: opts.ctx
    }) {
      try {
        const middleware = _def.middlewares[callOpts.index];
        const result2 = await middleware({
          ctx: callOpts.ctx,
          type: opts.type,
          path: opts.path,
          getRawInput: callOpts.getRawInput ?? opts.getRawInput,
          meta: _def.meta,
          input: callOpts.input,
          next(_nextOpts) {
            const nextOpts = _nextOpts;
            return callRecursive({
              index: callOpts.index + 1,
              ctx: nextOpts && "ctx" in nextOpts ? {
                ...callOpts.ctx,
                ...nextOpts.ctx
              } : callOpts.ctx,
              input: nextOpts && "input" in nextOpts ? nextOpts.input : callOpts.input,
              getRawInput: nextOpts && "getRawInput" in nextOpts ? nextOpts.getRawInput : callOpts.getRawInput
            });
          }
        });
        return result2;
      } catch (cause) {
        return {
          ok: false,
          error: getTRPCErrorFromUnknown(cause),
          marker: middlewareMarker
        };
      }
    }
    const result = await callRecursive();
    if (!result) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No result from middlewares - did you forget to `return next()`?"
      });
    }
    if (!result.ok) {
      throw result.error;
    }
    return result.data;
  }
  procedure._def = _def;
  return procedure;
}
var codeblock;
var init_procedureBuilder = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/procedureBuilder.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_TRPCError();
    init_middleware();
    init_parser();
    init_utils3();
    codeblock = `
This is a client-only function.
If you want to call this function on the server, see https://trpc.io/docs/v11/server/server-side-calls
`.trim();
  }
});
var TRPCBuilder;
var initTRPC;
var init_initTRPC = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/unstable-core-do-not-import/initTRPC.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_formatter();
    init_middleware();
    init_procedureBuilder();
    init_rootConfig();
    init_router();
    init_transformer();
    TRPCBuilder = class {
      /**
      * Add a context shape as a generic to the root object
      * @link https://trpc.io/docs/v11/server/context
      */
      context() {
        return new TRPCBuilder();
      }
      /**
      * Add a meta shape as a generic to the root object
      * @link https://trpc.io/docs/v11/quickstart
      */
      meta() {
        return new TRPCBuilder();
      }
      /**
      * Create the root object
      * @link https://trpc.io/docs/v11/server/routers#initialize-trpc
      */
      create(opts) {
        const config = {
          transformer: getDataTransformer(opts?.transformer ?? defaultTransformer),
          isDev: opts?.isDev ?? // eslint-disable-next-line @typescript-eslint/dot-notation
          globalThis.process?.env["NODE_ENV"] !== "production",
          allowOutsideOfServer: opts?.allowOutsideOfServer ?? false,
          errorFormatter: opts?.errorFormatter ?? defaultFormatter,
          isServer: opts?.isServer ?? isServerDefault,
          /**
          * These are just types, they can't be used at runtime
          * @internal
          */
          $types: null,
          experimental: opts?.experimental ?? {}
        };
        {
          const isServer = opts?.isServer ?? isServerDefault;
          if (!isServer && opts?.allowOutsideOfServer !== true) {
            throw new Error(`You're trying to use @trpc/server in a non-server environment. This is not supported by default.`);
          }
        }
        return {
          /**
          * Your router config
          * @internal
          */
          _config: config,
          /**
          * Builder object for creating procedures
          * @link https://trpc.io/docs/v11/server/procedures
          */
          procedure: createBuilder({
            meta: opts?.defaultMeta
          }),
          /**
          * Create reusable middlewares
          * @link https://trpc.io/docs/v11/server/middlewares
          */
          middleware: createMiddlewareFactory(),
          /**
          * Create a router
          * @link https://trpc.io/docs/v11/server/routers
          */
          router: createRouterFactory(config),
          /**
          * Merge Routers
          * @link https://trpc.io/docs/v11/server/merging-routers
          */
          mergeRouters,
          /**
          * Create a server-side caller for a router
          * @link https://trpc.io/docs/v11/server/server-side-calls
          */
          createCallerFactory: createCallerFactory()
        };
      }
    };
    initTRPC = new TRPCBuilder();
  }
});
var init_dist = __esm({
  "../../node_modules/.pnpm/@trpc+server@11.0.0-rc.402/node_modules/@trpc/server/dist/index.mjs"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_createProxy();
    init_TRPCError();
    init_getErrorShape();
    init_router();
    init_transformer();
    init_initTRPC();
    init_middleware();
    init_rootConfig();
  }
});
var DoubleIndexedKV;
var init_double_indexed_kv = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/double-indexed-kv.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    DoubleIndexedKV = class {
      constructor() {
        this.keyToValue = /* @__PURE__ */ new Map();
        this.valueToKey = /* @__PURE__ */ new Map();
      }
      set(key, value) {
        this.keyToValue.set(key, value);
        this.valueToKey.set(value, key);
      }
      getByKey(key) {
        return this.keyToValue.get(key);
      }
      getByValue(value) {
        return this.valueToKey.get(value);
      }
      clear() {
        this.keyToValue.clear();
        this.valueToKey.clear();
      }
    };
  }
});
var Registry;
var init_registry = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/registry.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_double_indexed_kv();
    Registry = class {
      constructor(generateIdentifier) {
        this.generateIdentifier = generateIdentifier;
        this.kv = new DoubleIndexedKV();
      }
      register(value, identifier) {
        if (this.kv.getByValue(value)) {
          return;
        }
        if (!identifier) {
          identifier = this.generateIdentifier(value);
        }
        this.kv.set(identifier, value);
      }
      clear() {
        this.kv.clear();
      }
      getIdentifier(value) {
        return this.kv.getByValue(value);
      }
      getValue(identifier) {
        return this.kv.getByKey(identifier);
      }
    };
  }
});
var ClassRegistry;
var init_class_registry = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/class-registry.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_registry();
    ClassRegistry = class extends Registry {
      constructor() {
        super((c) => c.name);
        this.classToAllowedProps = /* @__PURE__ */ new Map();
      }
      register(value, options) {
        if (typeof options === "object") {
          if (options.allowProps) {
            this.classToAllowedProps.set(value, options.allowProps);
          }
          super.register(value, options.identifier);
        } else {
          super.register(value, options);
        }
      }
      getAllowedProps(value) {
        return this.classToAllowedProps.get(value);
      }
    };
  }
});
function valuesOfObj(record) {
  if ("values" in Object) {
    return Object.values(record);
  }
  const values = [];
  for (const key in record) {
    if (record.hasOwnProperty(key)) {
      values.push(record[key]);
    }
  }
  return values;
}
function find(record, predicate) {
  const values = valuesOfObj(record);
  if ("find" in values) {
    return values.find(predicate);
  }
  const valuesNotNever = values;
  for (let i = 0; i < valuesNotNever.length; i++) {
    const value = valuesNotNever[i];
    if (predicate(value)) {
      return value;
    }
  }
  return void 0;
}
function forEach(record, run) {
  Object.entries(record).forEach(([key, value]) => run(value, key));
}
function includes(arr, value) {
  return arr.indexOf(value) !== -1;
}
function findArr(record, predicate) {
  for (let i = 0; i < record.length; i++) {
    const value = record[i];
    if (predicate(value)) {
      return value;
    }
  }
  return void 0;
}
var init_util = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/util.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
var CustomTransformerRegistry;
var init_custom_transformer_registry = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/custom-transformer-registry.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_util();
    CustomTransformerRegistry = class {
      constructor() {
        this.transfomers = {};
      }
      register(transformer) {
        this.transfomers[transformer.name] = transformer;
      }
      findApplicable(v) {
        return find(this.transfomers, (transformer) => transformer.isApplicable(v));
      }
      findByName(name) {
        return this.transfomers[name];
      }
    };
  }
});
var getType;
var isUndefined;
var isNull2;
var isPlainObject;
var isEmptyObject;
var isArray;
var isString;
var isNumber;
var isBoolean;
var isRegExp;
var isMap;
var isSet;
var isSymbol;
var isDate;
var isError;
var isNaNValue;
var isPrimitive;
var isBigint;
var isInfinite;
var isTypedArray;
var isURL;
var init_is = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/is.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    getType = (payload) => Object.prototype.toString.call(payload).slice(8, -1);
    isUndefined = (payload) => typeof payload === "undefined";
    isNull2 = (payload) => payload === null;
    isPlainObject = (payload) => {
      if (typeof payload !== "object" || payload === null)
        return false;
      if (payload === Object.prototype)
        return false;
      if (Object.getPrototypeOf(payload) === null)
        return true;
      return Object.getPrototypeOf(payload) === Object.prototype;
    };
    isEmptyObject = (payload) => isPlainObject(payload) && Object.keys(payload).length === 0;
    isArray = (payload) => Array.isArray(payload);
    isString = (payload) => typeof payload === "string";
    isNumber = (payload) => typeof payload === "number" && !isNaN(payload);
    isBoolean = (payload) => typeof payload === "boolean";
    isRegExp = (payload) => payload instanceof RegExp;
    isMap = (payload) => payload instanceof Map;
    isSet = (payload) => payload instanceof Set;
    isSymbol = (payload) => getType(payload) === "Symbol";
    isDate = (payload) => payload instanceof Date && !isNaN(payload.valueOf());
    isError = (payload) => payload instanceof Error;
    isNaNValue = (payload) => typeof payload === "number" && isNaN(payload);
    isPrimitive = (payload) => isBoolean(payload) || isNull2(payload) || isUndefined(payload) || isNumber(payload) || isString(payload) || isSymbol(payload);
    isBigint = (payload) => typeof payload === "bigint";
    isInfinite = (payload) => payload === Infinity || payload === -Infinity;
    isTypedArray = (payload) => ArrayBuffer.isView(payload) && !(payload instanceof DataView);
    isURL = (payload) => payload instanceof URL;
  }
});
var escapeKey;
var stringifyPath;
var parsePath;
var init_pathstringifier = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/pathstringifier.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    escapeKey = (key) => key.replace(/\./g, "\\.");
    stringifyPath = (path) => path.map(String).map(escapeKey).join(".");
    parsePath = (string) => {
      const result = [];
      let segment = "";
      for (let i = 0; i < string.length; i++) {
        let char = string.charAt(i);
        const isEscapedDot = char === "\\" && string.charAt(i + 1) === ".";
        if (isEscapedDot) {
          segment += ".";
          i++;
          continue;
        }
        const isEndOfSegment = char === ".";
        if (isEndOfSegment) {
          result.push(segment);
          segment = "";
          continue;
        }
        segment += char;
      }
      const lastSegment = segment;
      result.push(lastSegment);
      return result;
    };
  }
});
function simpleTransformation(isApplicable, annotation, transform, untransform) {
  return {
    isApplicable,
    annotation,
    transform,
    untransform
  };
}
function compositeTransformation(isApplicable, annotation, transform, untransform) {
  return {
    isApplicable,
    annotation,
    transform,
    untransform
  };
}
function isInstanceOfRegisteredClass(potentialClass, superJson) {
  if (potentialClass?.constructor) {
    const isRegistered = !!superJson.classRegistry.getIdentifier(potentialClass.constructor);
    return isRegistered;
  }
  return false;
}
var simpleRules;
var symbolRule;
var constructorToName;
var typedArrayRule;
var classRule;
var customRule;
var compositeRules;
var transformValue;
var simpleRulesByAnnotation;
var untransformValue;
var init_transformer2 = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/transformer.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_is();
    init_util();
    simpleRules = [
      simpleTransformation(isUndefined, "undefined", () => null, () => void 0),
      simpleTransformation(isBigint, "bigint", (v) => v.toString(), (v) => {
        if (typeof BigInt !== "undefined") {
          return BigInt(v);
        }
        console.error("Please add a BigInt polyfill.");
        return v;
      }),
      simpleTransformation(isDate, "Date", (v) => v.toISOString(), (v) => new Date(v)),
      simpleTransformation(isError, "Error", (v, superJson) => {
        const baseError = {
          name: v.name,
          message: v.message
        };
        superJson.allowedErrorProps.forEach((prop) => {
          baseError[prop] = v[prop];
        });
        return baseError;
      }, (v, superJson) => {
        const e = new Error(v.message);
        e.name = v.name;
        e.stack = v.stack;
        superJson.allowedErrorProps.forEach((prop) => {
          e[prop] = v[prop];
        });
        return e;
      }),
      simpleTransformation(isRegExp, "regexp", (v) => "" + v, (regex) => {
        const body = regex.slice(1, regex.lastIndexOf("/"));
        const flags2 = regex.slice(regex.lastIndexOf("/") + 1);
        return new RegExp(body, flags2);
      }),
      simpleTransformation(
        isSet,
        "set",
        // (sets only exist in es6+)
        // eslint-disable-next-line es5/no-es6-methods
        (v) => [...v.values()],
        (v) => new Set(v)
      ),
      simpleTransformation(isMap, "map", (v) => [...v.entries()], (v) => new Map(v)),
      simpleTransformation((v) => isNaNValue(v) || isInfinite(v), "number", (v) => {
        if (isNaNValue(v)) {
          return "NaN";
        }
        if (v > 0) {
          return "Infinity";
        } else {
          return "-Infinity";
        }
      }, Number),
      simpleTransformation((v) => v === 0 && 1 / v === -Infinity, "number", () => {
        return "-0";
      }, Number),
      simpleTransformation(isURL, "URL", (v) => v.toString(), (v) => new URL(v))
    ];
    symbolRule = compositeTransformation((s, superJson) => {
      if (isSymbol(s)) {
        const isRegistered = !!superJson.symbolRegistry.getIdentifier(s);
        return isRegistered;
      }
      return false;
    }, (s, superJson) => {
      const identifier = superJson.symbolRegistry.getIdentifier(s);
      return ["symbol", identifier];
    }, (v) => v.description, (_, a, superJson) => {
      const value = superJson.symbolRegistry.getValue(a[1]);
      if (!value) {
        throw new Error("Trying to deserialize unknown symbol");
      }
      return value;
    });
    constructorToName = [
      Int8Array,
      Uint8Array,
      Int16Array,
      Uint16Array,
      Int32Array,
      Uint32Array,
      Float32Array,
      Float64Array,
      Uint8ClampedArray
    ].reduce((obj, ctor) => {
      obj[ctor.name] = ctor;
      return obj;
    }, {});
    typedArrayRule = compositeTransformation(isTypedArray, (v) => ["typed-array", v.constructor.name], (v) => [...v], (v, a) => {
      const ctor = constructorToName[a[1]];
      if (!ctor) {
        throw new Error("Trying to deserialize unknown typed array");
      }
      return new ctor(v);
    });
    classRule = compositeTransformation(isInstanceOfRegisteredClass, (clazz, superJson) => {
      const identifier = superJson.classRegistry.getIdentifier(clazz.constructor);
      return ["class", identifier];
    }, (clazz, superJson) => {
      const allowedProps = superJson.classRegistry.getAllowedProps(clazz.constructor);
      if (!allowedProps) {
        return { ...clazz };
      }
      const result = {};
      allowedProps.forEach((prop) => {
        result[prop] = clazz[prop];
      });
      return result;
    }, (v, a, superJson) => {
      const clazz = superJson.classRegistry.getValue(a[1]);
      if (!clazz) {
        throw new Error("Trying to deserialize unknown class - check https://github.com/blitz-js/superjson/issues/116#issuecomment-773996564");
      }
      return Object.assign(Object.create(clazz.prototype), v);
    });
    customRule = compositeTransformation((value, superJson) => {
      return !!superJson.customTransformerRegistry.findApplicable(value);
    }, (value, superJson) => {
      const transformer = superJson.customTransformerRegistry.findApplicable(value);
      return ["custom", transformer.name];
    }, (value, superJson) => {
      const transformer = superJson.customTransformerRegistry.findApplicable(value);
      return transformer.serialize(value);
    }, (v, a, superJson) => {
      const transformer = superJson.customTransformerRegistry.findByName(a[1]);
      if (!transformer) {
        throw new Error("Trying to deserialize unknown custom value");
      }
      return transformer.deserialize(v);
    });
    compositeRules = [classRule, symbolRule, customRule, typedArrayRule];
    transformValue = (value, superJson) => {
      const applicableCompositeRule = findArr(compositeRules, (rule) => rule.isApplicable(value, superJson));
      if (applicableCompositeRule) {
        return {
          value: applicableCompositeRule.transform(value, superJson),
          type: applicableCompositeRule.annotation(value, superJson)
        };
      }
      const applicableSimpleRule = findArr(simpleRules, (rule) => rule.isApplicable(value, superJson));
      if (applicableSimpleRule) {
        return {
          value: applicableSimpleRule.transform(value, superJson),
          type: applicableSimpleRule.annotation
        };
      }
      return void 0;
    };
    simpleRulesByAnnotation = {};
    simpleRules.forEach((rule) => {
      simpleRulesByAnnotation[rule.annotation] = rule;
    });
    untransformValue = (json, type, superJson) => {
      if (isArray(type)) {
        switch (type[0]) {
          case "symbol":
            return symbolRule.untransform(json, type, superJson);
          case "class":
            return classRule.untransform(json, type, superJson);
          case "custom":
            return customRule.untransform(json, type, superJson);
          case "typed-array":
            return typedArrayRule.untransform(json, type, superJson);
          default:
            throw new Error("Unknown transformation: " + type);
        }
      } else {
        const transformation = simpleRulesByAnnotation[type];
        if (!transformation) {
          throw new Error("Unknown transformation: " + type);
        }
        return transformation.untransform(json, superJson);
      }
    };
  }
});
function validatePath(path) {
  if (includes(path, "__proto__")) {
    throw new Error("__proto__ is not allowed as a property");
  }
  if (includes(path, "prototype")) {
    throw new Error("prototype is not allowed as a property");
  }
  if (includes(path, "constructor")) {
    throw new Error("constructor is not allowed as a property");
  }
}
var getNthKey;
var getDeep;
var setDeep;
var init_accessDeep = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/accessDeep.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_is();
    init_util();
    getNthKey = (value, n) => {
      const keys = value.keys();
      while (n > 0) {
        keys.next();
        n--;
      }
      return keys.next().value;
    };
    getDeep = (object, path) => {
      validatePath(path);
      for (let i = 0; i < path.length; i++) {
        const key = path[i];
        if (isSet(object)) {
          object = getNthKey(object, +key);
        } else if (isMap(object)) {
          const row = +key;
          const type = +path[++i] === 0 ? "key" : "value";
          const keyOfRow = getNthKey(object, row);
          switch (type) {
            case "key":
              object = keyOfRow;
              break;
            case "value":
              object = object.get(keyOfRow);
              break;
          }
        } else {
          object = object[key];
        }
      }
      return object;
    };
    setDeep = (object, path, mapper) => {
      validatePath(path);
      if (path.length === 0) {
        return mapper(object);
      }
      let parent = object;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (isArray(parent)) {
          const index = +key;
          parent = parent[index];
        } else if (isPlainObject(parent)) {
          parent = parent[key];
        } else if (isSet(parent)) {
          const row = +key;
          parent = getNthKey(parent, row);
        } else if (isMap(parent)) {
          const isEnd = i === path.length - 2;
          if (isEnd) {
            break;
          }
          const row = +key;
          const type = +path[++i] === 0 ? "key" : "value";
          const keyOfRow = getNthKey(parent, row);
          switch (type) {
            case "key":
              parent = keyOfRow;
              break;
            case "value":
              parent = parent.get(keyOfRow);
              break;
          }
        }
      }
      const lastKey = path[path.length - 1];
      if (isArray(parent)) {
        parent[+lastKey] = mapper(parent[+lastKey]);
      } else if (isPlainObject(parent)) {
        parent[lastKey] = mapper(parent[lastKey]);
      }
      if (isSet(parent)) {
        const oldValue = getNthKey(parent, +lastKey);
        const newValue = mapper(oldValue);
        if (oldValue !== newValue) {
          parent.delete(oldValue);
          parent.add(newValue);
        }
      }
      if (isMap(parent)) {
        const row = +path[path.length - 2];
        const keyToRow = getNthKey(parent, row);
        const type = +lastKey === 0 ? "key" : "value";
        switch (type) {
          case "key": {
            const newKey = mapper(keyToRow);
            parent.set(newKey, parent.get(keyToRow));
            if (newKey !== keyToRow) {
              parent.delete(keyToRow);
            }
            break;
          }
          case "value": {
            parent.set(keyToRow, mapper(parent.get(keyToRow)));
            break;
          }
        }
      }
      return object;
    };
  }
});
function traverse(tree, walker2, origin2 = []) {
  if (!tree) {
    return;
  }
  if (!isArray(tree)) {
    forEach(tree, (subtree, key) => traverse(subtree, walker2, [...origin2, ...parsePath(key)]));
    return;
  }
  const [nodeValue, children] = tree;
  if (children) {
    forEach(children, (child, key) => {
      traverse(child, walker2, [...origin2, ...parsePath(key)]);
    });
  }
  walker2(nodeValue, origin2);
}
function applyValueAnnotations(plain, annotations, superJson) {
  traverse(annotations, (type, path) => {
    plain = setDeep(plain, path, (v) => untransformValue(v, type, superJson));
  });
  return plain;
}
function applyReferentialEqualityAnnotations(plain, annotations) {
  function apply(identicalPaths, path) {
    const object = getDeep(plain, parsePath(path));
    identicalPaths.map(parsePath).forEach((identicalObjectPath) => {
      plain = setDeep(plain, identicalObjectPath, () => object);
    });
  }
  if (isArray(annotations)) {
    const [root, other] = annotations;
    root.forEach((identicalPath) => {
      plain = setDeep(plain, parsePath(identicalPath), () => plain);
    });
    if (other) {
      forEach(other, apply);
    }
  } else {
    forEach(annotations, apply);
  }
  return plain;
}
function addIdentity(object, path, identities) {
  const existingSet = identities.get(object);
  if (existingSet) {
    existingSet.push(path);
  } else {
    identities.set(object, [path]);
  }
}
function generateReferentialEqualityAnnotations(identitites, dedupe) {
  const result = {};
  let rootEqualityPaths = void 0;
  identitites.forEach((paths) => {
    if (paths.length <= 1) {
      return;
    }
    if (!dedupe) {
      paths = paths.map((path) => path.map(String)).sort((a, b) => a.length - b.length);
    }
    const [representativePath, ...identicalPaths] = paths;
    if (representativePath.length === 0) {
      rootEqualityPaths = identicalPaths.map(stringifyPath);
    } else {
      result[stringifyPath(representativePath)] = identicalPaths.map(stringifyPath);
    }
  });
  if (rootEqualityPaths) {
    if (isEmptyObject(result)) {
      return [rootEqualityPaths];
    } else {
      return [rootEqualityPaths, result];
    }
  } else {
    return isEmptyObject(result) ? void 0 : result;
  }
}
var isDeep;
var walker;
var init_plainer = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/plainer.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_is();
    init_pathstringifier();
    init_transformer2();
    init_util();
    init_pathstringifier();
    init_accessDeep();
    isDeep = (object, superJson) => isPlainObject(object) || isArray(object) || isMap(object) || isSet(object) || isInstanceOfRegisteredClass(object, superJson);
    walker = (object, identities, superJson, dedupe, path = [], objectsInThisPath = [], seenObjects = /* @__PURE__ */ new Map()) => {
      const primitive = isPrimitive(object);
      if (!primitive) {
        addIdentity(object, path, identities);
        const seen = seenObjects.get(object);
        if (seen) {
          return dedupe ? {
            transformedValue: null
          } : seen;
        }
      }
      if (!isDeep(object, superJson)) {
        const transformed2 = transformValue(object, superJson);
        const result2 = transformed2 ? {
          transformedValue: transformed2.value,
          annotations: [transformed2.type]
        } : {
          transformedValue: object
        };
        if (!primitive) {
          seenObjects.set(object, result2);
        }
        return result2;
      }
      if (includes(objectsInThisPath, object)) {
        return {
          transformedValue: null
        };
      }
      const transformationResult = transformValue(object, superJson);
      const transformed = transformationResult?.value ?? object;
      const transformedValue = isArray(transformed) ? [] : {};
      const innerAnnotations = {};
      forEach(transformed, (value, index) => {
        if (index === "__proto__" || index === "constructor" || index === "prototype") {
          throw new Error(`Detected property ${index}. This is a prototype pollution risk, please remove it from your object.`);
        }
        const recursiveResult = walker(value, identities, superJson, dedupe, [...path, index], [...objectsInThisPath, object], seenObjects);
        transformedValue[index] = recursiveResult.transformedValue;
        if (isArray(recursiveResult.annotations)) {
          innerAnnotations[index] = recursiveResult.annotations;
        } else if (isPlainObject(recursiveResult.annotations)) {
          forEach(recursiveResult.annotations, (tree, key) => {
            innerAnnotations[escapeKey(index) + "." + key] = tree;
          });
        }
      });
      const result = isEmptyObject(innerAnnotations) ? {
        transformedValue,
        annotations: !!transformationResult ? [transformationResult.type] : void 0
      } : {
        transformedValue,
        annotations: !!transformationResult ? [transformationResult.type, innerAnnotations] : innerAnnotations
      };
      if (!primitive) {
        seenObjects.set(object, result);
      }
      return result;
    };
  }
});
function getType2(payload) {
  return Object.prototype.toString.call(payload).slice(8, -1);
}
function isArray2(payload) {
  return getType2(payload) === "Array";
}
function isPlainObject2(payload) {
  if (getType2(payload) !== "Object")
    return false;
  const prototype3 = Object.getPrototypeOf(payload);
  return !!prototype3 && prototype3.constructor === Object && prototype3 === Object.prototype;
}
function isNull3(payload) {
  return getType2(payload) === "Null";
}
function isOneOf(a, b, c, d, e) {
  return (value) => a(value) || b(value) || !!c && c(value) || !!d && d(value) || !!e && e(value);
}
function isUndefined2(payload) {
  return getType2(payload) === "Undefined";
}
var isNullOrUndefined;
var init_dist2 = __esm({
  "../../node_modules/.pnpm/is-what@4.1.16/node_modules/is-what/dist/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    isNullOrUndefined = isOneOf(isNull3, isUndefined2);
  }
});
function assignProp(carry, key, newVal, originalObject, includeNonenumerable) {
  const propType = {}.propertyIsEnumerable.call(originalObject, key) ? "enumerable" : "nonenumerable";
  if (propType === "enumerable")
    carry[key] = newVal;
  if (includeNonenumerable && propType === "nonenumerable") {
    Object.defineProperty(carry, key, {
      value: newVal,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
}
function copy(target, options = {}) {
  if (isArray2(target)) {
    return target.map((item) => copy(item, options));
  }
  if (!isPlainObject2(target)) {
    return target;
  }
  const props = Object.getOwnPropertyNames(target);
  const symbols = Object.getOwnPropertySymbols(target);
  return [...props, ...symbols].reduce((carry, key) => {
    if (isArray2(options.props) && !options.props.includes(key)) {
      return carry;
    }
    const val = target[key];
    const newVal = copy(val, options);
    assignProp(carry, key, newVal, target, options.nonenumerable);
    return carry;
  }, {});
}
var init_dist3 = __esm({
  "../../node_modules/.pnpm/copy-anything@3.0.5/node_modules/copy-anything/dist/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_dist2();
  }
});
var SuperJSON;
var serialize;
var deserialize;
var stringify;
var parse;
var registerClass;
var registerCustom;
var registerSymbol;
var allowErrorProps;
var init_dist4 = __esm({
  "../../node_modules/.pnpm/superjson@2.2.1/node_modules/superjson/dist/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_class_registry();
    init_registry();
    init_custom_transformer_registry();
    init_plainer();
    init_dist3();
    SuperJSON = class {
      /**
       * @param dedupeReferentialEqualities  If true, SuperJSON will make sure only one instance of referentially equal objects are serialized and the rest are replaced with `null`.
       */
      constructor({ dedupe = false } = {}) {
        this.classRegistry = new ClassRegistry();
        this.symbolRegistry = new Registry((s) => s.description ?? "");
        this.customTransformerRegistry = new CustomTransformerRegistry();
        this.allowedErrorProps = [];
        this.dedupe = dedupe;
      }
      serialize(object) {
        const identities = /* @__PURE__ */ new Map();
        const output = walker(object, identities, this, this.dedupe);
        const res = {
          json: output.transformedValue
        };
        if (output.annotations) {
          res.meta = {
            ...res.meta,
            values: output.annotations
          };
        }
        const equalityAnnotations = generateReferentialEqualityAnnotations(identities, this.dedupe);
        if (equalityAnnotations) {
          res.meta = {
            ...res.meta,
            referentialEqualities: equalityAnnotations
          };
        }
        return res;
      }
      deserialize(payload) {
        const { json, meta } = payload;
        let result = copy(json);
        if (meta?.values) {
          result = applyValueAnnotations(result, meta.values, this);
        }
        if (meta?.referentialEqualities) {
          result = applyReferentialEqualityAnnotations(result, meta.referentialEqualities);
        }
        return result;
      }
      stringify(object) {
        return JSON.stringify(this.serialize(object));
      }
      parse(string) {
        return this.deserialize(JSON.parse(string));
      }
      registerClass(v, options) {
        this.classRegistry.register(v, options);
      }
      registerSymbol(v, identifier) {
        this.symbolRegistry.register(v, identifier);
      }
      registerCustom(transformer, name) {
        this.customTransformerRegistry.register({
          name,
          ...transformer
        });
      }
      allowErrorProps(...props) {
        this.allowedErrorProps.push(...props);
      }
    };
    SuperJSON.defaultInstance = new SuperJSON();
    SuperJSON.serialize = SuperJSON.defaultInstance.serialize.bind(SuperJSON.defaultInstance);
    SuperJSON.deserialize = SuperJSON.defaultInstance.deserialize.bind(SuperJSON.defaultInstance);
    SuperJSON.stringify = SuperJSON.defaultInstance.stringify.bind(SuperJSON.defaultInstance);
    SuperJSON.parse = SuperJSON.defaultInstance.parse.bind(SuperJSON.defaultInstance);
    SuperJSON.registerClass = SuperJSON.defaultInstance.registerClass.bind(SuperJSON.defaultInstance);
    SuperJSON.registerSymbol = SuperJSON.defaultInstance.registerSymbol.bind(SuperJSON.defaultInstance);
    SuperJSON.registerCustom = SuperJSON.defaultInstance.registerCustom.bind(SuperJSON.defaultInstance);
    SuperJSON.allowErrorProps = SuperJSON.defaultInstance.allowErrorProps.bind(SuperJSON.defaultInstance);
    serialize = SuperJSON.serialize;
    deserialize = SuperJSON.deserialize;
    stringify = SuperJSON.stringify;
    parse = SuperJSON.parse;
    registerClass = SuperJSON.registerClass;
    registerCustom = SuperJSON.registerCustom;
    registerSymbol = SuperJSON.registerSymbol;
    allowErrorProps = SuperJSON.allowErrorProps;
  }
});
function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}
var init_bind = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/bind.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
function isBuffer(val) {
  return val !== null && !isUndefined3(val) && val.constructor !== null && !isUndefined3(val.constructor) && isFunction2(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
function forEach2(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray3(obj)) {
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function findKey(obj, key) {
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
function merge() {
  const { caseless } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject3(result[targetKey]) && isPlainObject3(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject3(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray3(val)) {
      result[targetKey] = val.slice();
    } else {
      result[targetKey] = val;
    }
  };
  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach2(arguments[i], assignValue);
  }
  return result;
}
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction2(thing.append) && thing[Symbol.toStringTag] === "FormData" && thing[Symbol.iterator]);
}
var toString;
var getPrototypeOf;
var kindOf;
var kindOfTest;
var typeOfTest;
var isArray3;
var isUndefined3;
var isArrayBuffer;
var isString2;
var isFunction2;
var isNumber2;
var isObject2;
var isBoolean2;
var isPlainObject3;
var isDate2;
var isFile;
var isBlob;
var isFileList;
var isStream;
var isFormData;
var isURLSearchParams;
var isReadableStream;
var isRequest;
var isResponse;
var isHeaders;
var trim;
var _global;
var isContextDefined;
var extend;
var stripBOM;
var inherits;
var toFlatObject;
var endsWith;
var toArray;
var isTypedArray2;
var forEachEntry;
var matchAll;
var isHTMLForm;
var toCamelCase;
var hasOwnProperty;
var isRegExp2;
var reduceDescriptors;
var freezeMethods;
var toObjectSet;
var noop2;
var toFiniteNumber;
var ALPHA;
var DIGIT;
var ALPHABET;
var generateString;
var toJSONObject;
var isAsyncFn;
var isThenable;
var utils_default;
var init_utils4 = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/utils.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_bind();
    ({ toString } = Object.prototype);
    ({ getPrototypeOf } = Object);
    kindOf = ((cache) => (thing) => {
      const str = toString.call(thing);
      return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
    })(/* @__PURE__ */ Object.create(null));
    kindOfTest = (type) => {
      type = type.toLowerCase();
      return (thing) => kindOf(thing) === type;
    };
    typeOfTest = (type) => (thing) => typeof thing === type;
    ({ isArray: isArray3 } = Array);
    isUndefined3 = typeOfTest("undefined");
    isArrayBuffer = kindOfTest("ArrayBuffer");
    isString2 = typeOfTest("string");
    isFunction2 = typeOfTest("function");
    isNumber2 = typeOfTest("number");
    isObject2 = (thing) => thing !== null && typeof thing === "object";
    isBoolean2 = (thing) => thing === true || thing === false;
    isPlainObject3 = (val) => {
      if (kindOf(val) !== "object") {
        return false;
      }
      const prototype3 = getPrototypeOf(val);
      return (prototype3 === null || prototype3 === Object.prototype || Object.getPrototypeOf(prototype3) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
    };
    isDate2 = kindOfTest("Date");
    isFile = kindOfTest("File");
    isBlob = kindOfTest("Blob");
    isFileList = kindOfTest("FileList");
    isStream = (val) => isObject2(val) && isFunction2(val.pipe);
    isFormData = (thing) => {
      let kind;
      return thing && (typeof FormData === "function" && thing instanceof FormData || isFunction2(thing.append) && ((kind = kindOf(thing)) === "formdata" || // detect form-data instance
      kind === "object" && isFunction2(thing.toString) && thing.toString() === "[object FormData]"));
    };
    isURLSearchParams = kindOfTest("URLSearchParams");
    [isReadableStream, isRequest, isResponse, isHeaders] = ["ReadableStream", "Request", "Response", "Headers"].map(kindOfTest);
    trim = (str) => str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    _global = (() => {
      if (typeof globalThis !== "undefined")
        return globalThis;
      return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
    })();
    isContextDefined = (context) => !isUndefined3(context) && context !== _global;
    extend = (a, b, thisArg, { allOwnKeys } = {}) => {
      forEach2(b, (val, key) => {
        if (thisArg && isFunction2(val)) {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      }, { allOwnKeys });
      return a;
    };
    stripBOM = (content) => {
      if (content.charCodeAt(0) === 65279) {
        content = content.slice(1);
      }
      return content;
    };
    inherits = (constructor, superConstructor, props, descriptors2) => {
      constructor.prototype = Object.create(superConstructor.prototype, descriptors2);
      constructor.prototype.constructor = constructor;
      Object.defineProperty(constructor, "super", {
        value: superConstructor.prototype
      });
      props && Object.assign(constructor.prototype, props);
    };
    toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
      let props;
      let i;
      let prop;
      const merged = {};
      destObj = destObj || {};
      if (sourceObj == null)
        return destObj;
      do {
        props = Object.getOwnPropertyNames(sourceObj);
        i = props.length;
        while (i-- > 0) {
          prop = props[i];
          if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
            destObj[prop] = sourceObj[prop];
            merged[prop] = true;
          }
        }
        sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
      } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
      return destObj;
    };
    endsWith = (str, searchString, position) => {
      str = String(str);
      if (position === void 0 || position > str.length) {
        position = str.length;
      }
      position -= searchString.length;
      const lastIndex = str.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    };
    toArray = (thing) => {
      if (!thing)
        return null;
      if (isArray3(thing))
        return thing;
      let i = thing.length;
      if (!isNumber2(i))
        return null;
      const arr = new Array(i);
      while (i-- > 0) {
        arr[i] = thing[i];
      }
      return arr;
    };
    isTypedArray2 = ((TypedArray) => {
      return (thing) => {
        return TypedArray && thing instanceof TypedArray;
      };
    })(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
    forEachEntry = (obj, fn) => {
      const generator = obj && obj[Symbol.iterator];
      const iterator = generator.call(obj);
      let result;
      while ((result = iterator.next()) && !result.done) {
        const pair = result.value;
        fn.call(obj, pair[0], pair[1]);
      }
    };
    matchAll = (regExp, str) => {
      let matches;
      const arr = [];
      while ((matches = regExp.exec(str)) !== null) {
        arr.push(matches);
      }
      return arr;
    };
    isHTMLForm = kindOfTest("HTMLFormElement");
    toCamelCase = (str) => {
      return str.toLowerCase().replace(
        /[-_\s]([a-z\d])(\w*)/g,
        function replacer(m, p1, p2) {
          return p1.toUpperCase() + p2;
        }
      );
    };
    hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
    isRegExp2 = kindOfTest("RegExp");
    reduceDescriptors = (obj, reducer) => {
      const descriptors2 = Object.getOwnPropertyDescriptors(obj);
      const reducedDescriptors = {};
      forEach2(descriptors2, (descriptor, name) => {
        let ret;
        if ((ret = reducer(descriptor, name, obj)) !== false) {
          reducedDescriptors[name] = ret || descriptor;
        }
      });
      Object.defineProperties(obj, reducedDescriptors);
    };
    freezeMethods = (obj) => {
      reduceDescriptors(obj, (descriptor, name) => {
        if (isFunction2(obj) && ["arguments", "caller", "callee"].indexOf(name) !== -1) {
          return false;
        }
        const value = obj[name];
        if (!isFunction2(value))
          return;
        descriptor.enumerable = false;
        if ("writable" in descriptor) {
          descriptor.writable = false;
          return;
        }
        if (!descriptor.set) {
          descriptor.set = () => {
            throw Error("Can not rewrite read-only method '" + name + "'");
          };
        }
      });
    };
    toObjectSet = (arrayOrString, delimiter) => {
      const obj = {};
      const define = (arr) => {
        arr.forEach((value) => {
          obj[value] = true;
        });
      };
      isArray3(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
      return obj;
    };
    noop2 = () => {
    };
    toFiniteNumber = (value, defaultValue) => {
      return value != null && Number.isFinite(value = +value) ? value : defaultValue;
    };
    ALPHA = "abcdefghijklmnopqrstuvwxyz";
    DIGIT = "0123456789";
    ALPHABET = {
      DIGIT,
      ALPHA,
      ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
    };
    generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
      let str = "";
      const { length } = alphabet;
      while (size--) {
        str += alphabet[Math.random() * length | 0];
      }
      return str;
    };
    toJSONObject = (obj) => {
      const stack = new Array(10);
      const visit = (source, i) => {
        if (isObject2(source)) {
          if (stack.indexOf(source) >= 0) {
            return;
          }
          if (!("toJSON" in source)) {
            stack[i] = source;
            const target = isArray3(source) ? [] : {};
            forEach2(source, (value, key) => {
              const reducedValue = visit(value, i + 1);
              !isUndefined3(reducedValue) && (target[key] = reducedValue);
            });
            stack[i] = void 0;
            return target;
          }
        }
        return source;
      };
      return visit(obj, 0);
    };
    isAsyncFn = kindOfTest("AsyncFunction");
    isThenable = (thing) => thing && (isObject2(thing) || isFunction2(thing)) && isFunction2(thing.then) && isFunction2(thing.catch);
    utils_default = {
      isArray: isArray3,
      isArrayBuffer,
      isBuffer,
      isFormData,
      isArrayBufferView,
      isString: isString2,
      isNumber: isNumber2,
      isBoolean: isBoolean2,
      isObject: isObject2,
      isPlainObject: isPlainObject3,
      isReadableStream,
      isRequest,
      isResponse,
      isHeaders,
      isUndefined: isUndefined3,
      isDate: isDate2,
      isFile,
      isBlob,
      isRegExp: isRegExp2,
      isFunction: isFunction2,
      isStream,
      isURLSearchParams,
      isTypedArray: isTypedArray2,
      isFileList,
      forEach: forEach2,
      merge,
      extend,
      trim,
      stripBOM,
      inherits,
      toFlatObject,
      kindOf,
      kindOfTest,
      endsWith,
      toArray,
      forEachEntry,
      matchAll,
      isHTMLForm,
      hasOwnProperty,
      hasOwnProp: hasOwnProperty,
      // an alias to avoid ESLint no-prototype-builtins detection
      reduceDescriptors,
      freezeMethods,
      toObjectSet,
      toCamelCase,
      noop: noop2,
      toFiniteNumber,
      findKey,
      global: _global,
      isContextDefined,
      ALPHABET,
      generateString,
      isSpecCompliantForm,
      toJSONObject,
      isAsyncFn,
      isThenable
    };
  }
});
function AxiosError(message, code, config, request, response) {
  Error.call(this);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack;
  }
  this.message = message;
  this.name = "AxiosError";
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  response && (this.response = response);
}
var prototype;
var descriptors;
var AxiosError_default;
var init_AxiosError = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/core/AxiosError.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    utils_default.inherits(AxiosError, Error, {
      toJSON: function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: utils_default.toJSONObject(this.config),
          code: this.code,
          status: this.response && this.response.status ? this.response.status : null
        };
      }
    });
    prototype = AxiosError.prototype;
    descriptors = {};
    [
      "ERR_BAD_OPTION_VALUE",
      "ERR_BAD_OPTION",
      "ECONNABORTED",
      "ETIMEDOUT",
      "ERR_NETWORK",
      "ERR_FR_TOO_MANY_REDIRECTS",
      "ERR_DEPRECATED",
      "ERR_BAD_RESPONSE",
      "ERR_BAD_REQUEST",
      "ERR_CANCELED",
      "ERR_NOT_SUPPORT",
      "ERR_INVALID_URL"
      // eslint-disable-next-line func-names
    ].forEach((code) => {
      descriptors[code] = { value: code };
    });
    Object.defineProperties(AxiosError, descriptors);
    Object.defineProperty(prototype, "isAxiosError", { value: true });
    AxiosError.from = (error, code, config, request, response, customProps) => {
      const axiosError = Object.create(prototype);
      utils_default.toFlatObject(error, axiosError, function filter2(obj) {
        return obj !== Error.prototype;
      }, (prop) => {
        return prop !== "isAxiosError";
      });
      AxiosError.call(axiosError, error.message, code, config, request, response);
      axiosError.cause = error;
      axiosError.name = error.name;
      customProps && Object.assign(axiosError, customProps);
      return axiosError;
    };
    AxiosError_default = AxiosError;
  }
});
var null_default;
var init_null = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/null.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    null_default = null;
  }
});
function isVisitable(thing) {
  return utils_default.isPlainObject(thing) || utils_default.isArray(thing);
}
function removeBrackets(key) {
  return utils_default.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path, key, dots) {
  if (!path)
    return key;
  return path.concat(key).map(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils_default.isArray(arr) && !arr.some(isVisitable);
}
function toFormData(obj, formData, options) {
  if (!utils_default.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new (null_default || FormData)();
  options = utils_default.toFlatObject(options, {
    metaTokens: true,
    dots: false,
    indexes: false
  }, false, function defined(option, source) {
    return !utils_default.isUndefined(source[option]);
  });
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const useBlob = _Blob && utils_default.isSpecCompliantForm(formData);
  if (!utils_default.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null)
      return "";
    if (utils_default.isDate(value)) {
      return value.toISOString();
    }
    if (!useBlob && utils_default.isBlob(value)) {
      throw new AxiosError_default("Blob is not supported. Use a Buffer instead.");
    }
    if (utils_default.isArrayBuffer(value) || utils_default.isTypedArray(value)) {
      return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
    }
    return value;
  }
  function defaultVisitor(value, key, path) {
    let arr = value;
    if (value && !path && typeof value === "object") {
      if (utils_default.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = JSON.stringify(value);
      } else if (utils_default.isArray(value) && isFlatArray(value) || (utils_default.isFileList(value) || utils_default.endsWith(key, "[]")) && (arr = utils_default.toArray(value))) {
        key = removeBrackets(key);
        arr.forEach(function each(el, index) {
          !(utils_default.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el)
          );
        });
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path, key, dots), convertValue(value));
    return false;
  }
  const stack = [];
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path) {
    if (utils_default.isUndefined(value))
      return;
    if (stack.indexOf(value) !== -1) {
      throw Error("Circular reference detected in " + path.join("."));
    }
    stack.push(value);
    utils_default.forEach(value, function each(el, key) {
      const result = !(utils_default.isUndefined(el) || el === null) && visitor.call(
        formData,
        el,
        utils_default.isString(key) ? key.trim() : key,
        path,
        exposedHelpers
      );
      if (result === true) {
        build(el, path ? path.concat(key) : [key]);
      }
    });
    stack.pop();
  }
  if (!utils_default.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
var predicates;
var toFormData_default;
var init_toFormData = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/toFormData.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_AxiosError();
    init_null();
    predicates = utils_default.toFlatObject(utils_default, {}, null, function filter(prop) {
      return /^is[A-Z]/.test(prop);
    });
    toFormData_default = toFormData;
  }
});
function encode(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match2) {
    return charMap[match2];
  });
}
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData_default(params, this, options);
}
var prototype2;
var AxiosURLSearchParams_default;
var init_AxiosURLSearchParams = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/AxiosURLSearchParams.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_toFormData();
    prototype2 = AxiosURLSearchParams.prototype;
    prototype2.append = function append(name, value) {
      this._pairs.push([name, value]);
    };
    prototype2.toString = function toString2(encoder) {
      const _encode = encoder ? function(value) {
        return encoder.call(this, value, encode);
      } : encode;
      return this._pairs.map(function each(pair) {
        return _encode(pair[0]) + "=" + _encode(pair[1]);
      }, "").join("&");
    };
    AxiosURLSearchParams_default = AxiosURLSearchParams;
  }
});
function encode2(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
function buildURL(url, params, options) {
  if (!params) {
    return url;
  }
  const _encode = options && options.encode || encode2;
  const serializeFn = options && options.serialize;
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, options);
  } else {
    serializedParams = utils_default.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams_default(params, options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url;
}
var init_buildURL = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/buildURL.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_AxiosURLSearchParams();
  }
});
var InterceptorManager;
var InterceptorManager_default;
var init_InterceptorManager = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/core/InterceptorManager.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    InterceptorManager = class {
      constructor() {
        this.handlers = [];
      }
      /**
       * Add a new interceptor to the stack
       *
       * @param {Function} fulfilled The function to handle `then` for a `Promise`
       * @param {Function} rejected The function to handle `reject` for a `Promise`
       *
       * @return {Number} An ID used to remove interceptor later
       */
      use(fulfilled, rejected, options) {
        this.handlers.push({
          fulfilled,
          rejected,
          synchronous: options ? options.synchronous : false,
          runWhen: options ? options.runWhen : null
        });
        return this.handlers.length - 1;
      }
      /**
       * Remove an interceptor from the stack
       *
       * @param {Number} id The ID that was returned by `use`
       *
       * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
       */
      eject(id) {
        if (this.handlers[id]) {
          this.handlers[id] = null;
        }
      }
      /**
       * Clear all interceptors from the stack
       *
       * @returns {void}
       */
      clear() {
        if (this.handlers) {
          this.handlers = [];
        }
      }
      /**
       * Iterate over all the registered interceptors
       *
       * This method is particularly useful for skipping over any
       * interceptors that may have become `null` calling `eject`.
       *
       * @param {Function} fn The function to call for each interceptor
       *
       * @returns {void}
       */
      forEach(fn) {
        utils_default.forEach(this.handlers, function forEachHandler(h) {
          if (h !== null) {
            fn(h);
          }
        });
      }
    };
    InterceptorManager_default = InterceptorManager;
  }
});
var transitional_default;
var init_transitional = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/defaults/transitional.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    transitional_default = {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false
    };
  }
});
var URLSearchParams_default;
var init_URLSearchParams = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/platform/browser/classes/URLSearchParams.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_AxiosURLSearchParams();
    URLSearchParams_default = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams_default;
  }
});
var FormData_default;
var init_FormData = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/platform/browser/classes/FormData.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    FormData_default = typeof FormData !== "undefined" ? FormData : null;
  }
});
var Blob_default;
var init_Blob = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/platform/browser/classes/Blob.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    Blob_default = typeof Blob !== "undefined" ? Blob : null;
  }
});
var browser_default;
var init_browser = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/platform/browser/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_URLSearchParams();
    init_FormData();
    init_Blob();
    browser_default = {
      isBrowser: true,
      classes: {
        URLSearchParams: URLSearchParams_default,
        FormData: FormData_default,
        Blob: Blob_default
      },
      protocols: ["http", "https", "file", "blob", "url", "data"]
    };
  }
});
var utils_exports = {};
__export(utils_exports, {
  hasBrowserEnv: () => hasBrowserEnv,
  hasStandardBrowserEnv: () => hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv: () => hasStandardBrowserWebWorkerEnv,
  origin: () => origin
});
var hasBrowserEnv;
var hasStandardBrowserEnv;
var hasStandardBrowserWebWorkerEnv;
var origin;
var init_utils5 = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/platform/common/utils.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
    hasStandardBrowserEnv = ((product) => {
      return hasBrowserEnv && ["ReactNative", "NativeScript", "NS"].indexOf(product) < 0;
    })(typeof navigator !== "undefined" && navigator.product);
    hasStandardBrowserWebWorkerEnv = (() => {
      return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
      self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
    })();
    origin = hasBrowserEnv && window.location.href || "http://localhost";
  }
});
var platform_default;
var init_platform = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/platform/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_browser();
    init_utils5();
    platform_default = {
      ...utils_exports,
      ...browser_default
    };
  }
});
function toURLEncodedForm(data, options) {
  return toFormData_default(data, new platform_default.classes.URLSearchParams(), Object.assign({
    visitor: function(value, key, path, helpers) {
      if (platform_default.isNode && utils_default.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    }
  }, options));
}
var init_toURLEncodedForm = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/toURLEncodedForm.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_toFormData();
    init_platform();
  }
});
function parsePropPath(name) {
  return utils_default.matchAll(/\w+|\[(\w*)]/g, name).map((match2) => {
    return match2[0] === "[]" ? "" : match2[1] || match2[0];
  });
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    let name = path[index++];
    if (name === "__proto__")
      return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils_default.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils_default.hasOwnProp(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!target[name] || !utils_default.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path, value, target[name], index);
    if (result && utils_default.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils_default.isFormData(formData) && utils_default.isFunction(formData.entries)) {
    const obj = {};
    utils_default.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
var formDataToJSON_default;
var init_formDataToJSON = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/formDataToJSON.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    formDataToJSON_default = formDataToJSON;
  }
});
function stringifySafely(rawValue, parser, encoder) {
  if (utils_default.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils_default.trim(rawValue);
    } catch (e) {
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
var defaults;
var defaults_default;
var init_defaults = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/defaults/index.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_AxiosError();
    init_transitional();
    init_toFormData();
    init_toURLEncodedForm();
    init_platform();
    init_formDataToJSON();
    defaults = {
      transitional: transitional_default,
      adapter: ["xhr", "http", "fetch"],
      transformRequest: [function transformRequest(data, headers) {
        const contentType = headers.getContentType() || "";
        const hasJSONContentType = contentType.indexOf("application/json") > -1;
        const isObjectPayload = utils_default.isObject(data);
        if (isObjectPayload && utils_default.isHTMLForm(data)) {
          data = new FormData(data);
        }
        const isFormData2 = utils_default.isFormData(data);
        if (isFormData2) {
          return hasJSONContentType ? JSON.stringify(formDataToJSON_default(data)) : data;
        }
        if (utils_default.isArrayBuffer(data) || utils_default.isBuffer(data) || utils_default.isStream(data) || utils_default.isFile(data) || utils_default.isBlob(data) || utils_default.isReadableStream(data)) {
          return data;
        }
        if (utils_default.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils_default.isURLSearchParams(data)) {
          headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
          return data.toString();
        }
        let isFileList2;
        if (isObjectPayload) {
          if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
            return toURLEncodedForm(data, this.formSerializer).toString();
          }
          if ((isFileList2 = utils_default.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
            const _FormData = this.env && this.env.FormData;
            return toFormData_default(
              isFileList2 ? { "files[]": data } : data,
              _FormData && new _FormData(),
              this.formSerializer
            );
          }
        }
        if (isObjectPayload || hasJSONContentType) {
          headers.setContentType("application/json", false);
          return stringifySafely(data);
        }
        return data;
      }],
      transformResponse: [function transformResponse(data) {
        const transitional2 = this.transitional || defaults.transitional;
        const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
        const JSONRequested = this.responseType === "json";
        if (utils_default.isResponse(data) || utils_default.isReadableStream(data)) {
          return data;
        }
        if (data && utils_default.isString(data) && (forcedJSONParsing && !this.responseType || JSONRequested)) {
          const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
          const strictJSONParsing = !silentJSONParsing && JSONRequested;
          try {
            return JSON.parse(data);
          } catch (e) {
            if (strictJSONParsing) {
              if (e.name === "SyntaxError") {
                throw AxiosError_default.from(e, AxiosError_default.ERR_BAD_RESPONSE, this, null, this.response);
              }
              throw e;
            }
          }
        }
        return data;
      }],
      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,
      xsrfCookieName: "XSRF-TOKEN",
      xsrfHeaderName: "X-XSRF-TOKEN",
      maxContentLength: -1,
      maxBodyLength: -1,
      env: {
        FormData: platform_default.classes.FormData,
        Blob: platform_default.classes.Blob
      },
      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      },
      headers: {
        common: {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": void 0
        }
      }
    };
    utils_default.forEach(["delete", "get", "head", "post", "put", "patch"], (method) => {
      defaults.headers[method] = {};
    });
    defaults_default = defaults;
  }
});
var ignoreDuplicateOf;
var parseHeaders_default;
var init_parseHeaders = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/parseHeaders.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    ignoreDuplicateOf = utils_default.toObjectSet([
      "age",
      "authorization",
      "content-length",
      "content-type",
      "etag",
      "expires",
      "from",
      "host",
      "if-modified-since",
      "if-unmodified-since",
      "last-modified",
      "location",
      "max-forwards",
      "proxy-authorization",
      "referer",
      "retry-after",
      "user-agent"
    ]);
    parseHeaders_default = (rawHeaders) => {
      const parsed = {};
      let key;
      let val;
      let i;
      rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
        i = line.indexOf(":");
        key = line.substring(0, i).trim().toLowerCase();
        val = line.substring(i + 1).trim();
        if (!key || parsed[key] && ignoreDuplicateOf[key]) {
          return;
        }
        if (key === "set-cookie") {
          if (parsed[key]) {
            parsed[key].push(val);
          } else {
            parsed[key] = [val];
          }
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
        }
      });
      return parsed;
    };
  }
});
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils_default.isArray(value) ? value.map(normalizeValue) : String(value);
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match2;
  while (match2 = tokensRE.exec(str)) {
    tokens[match2[1]] = match2[2];
  }
  return tokens;
}
function matchHeaderValue(context, value, header, filter2, isHeaderNameFilter) {
  if (utils_default.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (isHeaderNameFilter) {
    value = header;
  }
  if (!utils_default.isString(value))
    return;
  if (utils_default.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils_default.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils_default.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
var $internals;
var isValidHeaderName;
var AxiosHeaders;
var AxiosHeaders_default;
var init_AxiosHeaders = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/core/AxiosHeaders.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_parseHeaders();
    $internals = Symbol("internals");
    isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
    AxiosHeaders = class {
      constructor(headers) {
        headers && this.set(headers);
      }
      set(header, valueOrRewrite, rewrite) {
        const self2 = this;
        function setHeader(_value, _header, _rewrite) {
          const lHeader = normalizeHeader(_header);
          if (!lHeader) {
            throw new Error("header name must be a non-empty string");
          }
          const key = utils_default.findKey(self2, lHeader);
          if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
            self2[key || _header] = normalizeValue(_value);
          }
        }
        const setHeaders = (headers, _rewrite) => utils_default.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
        if (utils_default.isPlainObject(header) || header instanceof this.constructor) {
          setHeaders(header, valueOrRewrite);
        } else if (utils_default.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
          setHeaders(parseHeaders_default(header), valueOrRewrite);
        } else if (utils_default.isHeaders(header)) {
          for (const [key, value] of header.entries()) {
            setHeader(value, key, rewrite);
          }
        } else {
          header != null && setHeader(valueOrRewrite, header, rewrite);
        }
        return this;
      }
      get(header, parser) {
        header = normalizeHeader(header);
        if (header) {
          const key = utils_default.findKey(this, header);
          if (key) {
            const value = this[key];
            if (!parser) {
              return value;
            }
            if (parser === true) {
              return parseTokens(value);
            }
            if (utils_default.isFunction(parser)) {
              return parser.call(this, value, key);
            }
            if (utils_default.isRegExp(parser)) {
              return parser.exec(value);
            }
            throw new TypeError("parser must be boolean|regexp|function");
          }
        }
      }
      has(header, matcher) {
        header = normalizeHeader(header);
        if (header) {
          const key = utils_default.findKey(this, header);
          return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
        }
        return false;
      }
      delete(header, matcher) {
        const self2 = this;
        let deleted = false;
        function deleteHeader(_header) {
          _header = normalizeHeader(_header);
          if (_header) {
            const key = utils_default.findKey(self2, _header);
            if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
              delete self2[key];
              deleted = true;
            }
          }
        }
        if (utils_default.isArray(header)) {
          header.forEach(deleteHeader);
        } else {
          deleteHeader(header);
        }
        return deleted;
      }
      clear(matcher) {
        const keys = Object.keys(this);
        let i = keys.length;
        let deleted = false;
        while (i--) {
          const key = keys[i];
          if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
            delete this[key];
            deleted = true;
          }
        }
        return deleted;
      }
      normalize(format) {
        const self2 = this;
        const headers = {};
        utils_default.forEach(this, (value, header) => {
          const key = utils_default.findKey(headers, header);
          if (key) {
            self2[key] = normalizeValue(value);
            delete self2[header];
            return;
          }
          const normalized = format ? formatHeader(header) : String(header).trim();
          if (normalized !== header) {
            delete self2[header];
          }
          self2[normalized] = normalizeValue(value);
          headers[normalized] = true;
        });
        return this;
      }
      concat(...targets) {
        return this.constructor.concat(this, ...targets);
      }
      toJSON(asStrings) {
        const obj = /* @__PURE__ */ Object.create(null);
        utils_default.forEach(this, (value, header) => {
          value != null && value !== false && (obj[header] = asStrings && utils_default.isArray(value) ? value.join(", ") : value);
        });
        return obj;
      }
      [Symbol.iterator]() {
        return Object.entries(this.toJSON())[Symbol.iterator]();
      }
      toString() {
        return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
      }
      get [Symbol.toStringTag]() {
        return "AxiosHeaders";
      }
      static from(thing) {
        return thing instanceof this ? thing : new this(thing);
      }
      static concat(first, ...targets) {
        const computed = new this(first);
        targets.forEach((target) => computed.set(target));
        return computed;
      }
      static accessor(header) {
        const internals = this[$internals] = this[$internals] = {
          accessors: {}
        };
        const accessors = internals.accessors;
        const prototype3 = this.prototype;
        function defineAccessor(_header) {
          const lHeader = normalizeHeader(_header);
          if (!accessors[lHeader]) {
            buildAccessors(prototype3, _header);
            accessors[lHeader] = true;
          }
        }
        utils_default.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
        return this;
      }
    };
    AxiosHeaders.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
    utils_default.reduceDescriptors(AxiosHeaders.prototype, ({ value }, key) => {
      let mapped = key[0].toUpperCase() + key.slice(1);
      return {
        get: () => value,
        set(headerValue) {
          this[mapped] = headerValue;
        }
      };
    });
    utils_default.freezeMethods(AxiosHeaders);
    AxiosHeaders_default = AxiosHeaders;
  }
});
function transformData(fns, response) {
  const config = this || defaults_default;
  const context = response || config;
  const headers = AxiosHeaders_default.from(context.headers);
  let data = context.data;
  utils_default.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}
var init_transformData = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/core/transformData.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_defaults();
    init_AxiosHeaders();
  }
});
function isCancel(value) {
  return !!(value && value.__CANCEL__);
}
var init_isCancel = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/cancel/isCancel.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
function CanceledError(message, config, request) {
  AxiosError_default.call(this, message == null ? "canceled" : message, AxiosError_default.ERR_CANCELED, config, request);
  this.name = "CanceledError";
}
var CanceledError_default;
var init_CanceledError = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/cancel/CanceledError.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_AxiosError();
    init_utils4();
    utils_default.inherits(CanceledError, AxiosError_default, {
      __CANCEL__: true
    });
    CanceledError_default = CanceledError;
  }
});
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError_default(
      "Request failed with status code " + response.status,
      [AxiosError_default.ERR_BAD_REQUEST, AxiosError_default.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
}
var init_settle = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/core/settle.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_AxiosError();
  }
});
function parseProtocol(url) {
  const match2 = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match2 && match2[1] || "";
}
var init_parseProtocol = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/parseProtocol.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
var speedometer_default;
var init_speedometer = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/speedometer.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    speedometer_default = speedometer;
  }
});
function throttle(fn, freq) {
  let timestamp = 0;
  const threshold = 1e3 / freq;
  let timer = null;
  return function throttled() {
    const force = this === true;
    const now = Date.now();
    if (force || now - timestamp > threshold) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      timestamp = now;
      return fn.apply(null, arguments);
    }
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        timestamp = Date.now();
        return fn.apply(null, arguments);
      }, threshold - (now - timestamp));
    }
  };
}
var throttle_default;
var init_throttle = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/throttle.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    throttle_default = throttle;
  }
});
var progressEventReducer_default;
var init_progressEventReducer = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/progressEventReducer.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_speedometer();
    init_throttle();
    progressEventReducer_default = (listener, isDownloadStream, freq = 3) => {
      let bytesNotified = 0;
      const _speedometer = speedometer_default(50, 250);
      return throttle_default((e) => {
        const loaded = e.loaded;
        const total = e.lengthComputable ? e.total : void 0;
        const progressBytes = loaded - bytesNotified;
        const rate = _speedometer(progressBytes);
        const inRange = loaded <= total;
        bytesNotified = loaded;
        const data = {
          loaded,
          total,
          progress: total ? loaded / total : void 0,
          bytes: progressBytes,
          rate: rate ? rate : void 0,
          estimated: rate && total && inRange ? (total - loaded) / rate : void 0,
          event: e,
          lengthComputable: total != null
        };
        data[isDownloadStream ? "download" : "upload"] = true;
        listener(data);
      }, freq);
    };
  }
});
var isURLSameOrigin_default;
var init_isURLSameOrigin = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/isURLSameOrigin.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_platform();
    isURLSameOrigin_default = platform_default.hasStandardBrowserEnv ? (
      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
      function standardBrowserEnv() {
        const msie = /(msie|trident)/i.test("Cloudflare-Workers");
        const urlParsingNode = document.createElement("a");
        let originURL;
        function resolveURL(url) {
          let href = url;
          if (msie) {
            urlParsingNode.setAttribute("href", href);
            href = urlParsingNode.href;
          }
          urlParsingNode.setAttribute("href", href);
          return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, "") : "",
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, "") : "",
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, "") : "",
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: urlParsingNode.pathname.charAt(0) === "/" ? urlParsingNode.pathname : "/" + urlParsingNode.pathname
          };
        }
        originURL = resolveURL(window.location.href);
        return function isURLSameOrigin(requestURL) {
          const parsed = utils_default.isString(requestURL) ? resolveURL(requestURL) : requestURL;
          return parsed.protocol === originURL.protocol && parsed.host === originURL.host;
        };
      }()
    ) : (
      // Non standard browser envs (web workers, react-native) lack needed support.
      function nonStandardBrowserEnv() {
        return function isURLSameOrigin() {
          return true;
        };
      }()
    );
  }
});
var cookies_default;
var init_cookies = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/cookies.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_platform();
    cookies_default = platform_default.hasStandardBrowserEnv ? (
      // Standard browser envs support document.cookie
      {
        write(name, value, expires, path, domain, secure2) {
          const cookie = [name + "=" + encodeURIComponent(value)];
          utils_default.isNumber(expires) && cookie.push("expires=" + new Date(expires).toGMTString());
          utils_default.isString(path) && cookie.push("path=" + path);
          utils_default.isString(domain) && cookie.push("domain=" + domain);
          secure2 === true && cookie.push("secure");
          document.cookie = cookie.join("; ");
        },
        read(name) {
          const match2 = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
          return match2 ? decodeURIComponent(match2[3]) : null;
        },
        remove(name) {
          this.write(name, "", Date.now() - 864e5);
        }
      }
    ) : (
      // Non-standard browser env (web workers, react-native) lack needed support.
      {
        write() {
        },
        read() {
          return null;
        },
        remove() {
        }
      }
    );
  }
});
function isAbsoluteURL(url) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
var init_isAbsoluteURL = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/isAbsoluteURL.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}
var init_combineURLs = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/combineURLs.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
var init_buildFullPath = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/core/buildFullPath.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_isAbsoluteURL();
    init_combineURLs();
  }
});
function mergeConfig(config1, config2) {
  config2 = config2 || {};
  const config = {};
  function getMergedValue(target, source, caseless) {
    if (utils_default.isPlainObject(target) && utils_default.isPlainObject(source)) {
      return utils_default.merge.call({ caseless }, target, source);
    } else if (utils_default.isPlainObject(source)) {
      return utils_default.merge({}, source);
    } else if (utils_default.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(a, b, caseless) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(a, b, caseless);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a, caseless);
    }
  }
  function valueFromConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  function defaultToConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a);
    }
  }
  function mergeDirectKeys(a, b, prop) {
    if (prop in config2) {
      return getMergedValue(a, b);
    } else if (prop in config1) {
      return getMergedValue(void 0, a);
    }
  }
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b) => mergeDeepProperties(headersToObject(a), headersToObject(b), true)
  };
  utils_default.forEach(Object.keys(Object.assign({}, config1, config2)), function computeConfigValue(prop) {
    const merge2 = mergeMap[prop] || mergeDeepProperties;
    const configValue = merge2(config1[prop], config2[prop], prop);
    utils_default.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
  });
  return config;
}
var headersToObject;
var init_mergeConfig = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/core/mergeConfig.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_AxiosHeaders();
    headersToObject = (thing) => thing instanceof AxiosHeaders_default ? { ...thing } : thing;
  }
});
var resolveConfig_default;
var init_resolveConfig = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/resolveConfig.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_platform();
    init_utils4();
    init_isURLSameOrigin();
    init_cookies();
    init_buildFullPath();
    init_mergeConfig();
    init_AxiosHeaders();
    init_buildURL();
    resolveConfig_default = (config) => {
      const newConfig = mergeConfig({}, config);
      let { data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = newConfig;
      newConfig.headers = headers = AxiosHeaders_default.from(headers);
      newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url), config.params, config.paramsSerializer);
      if (auth) {
        headers.set(
          "Authorization",
          "Basic " + btoa((auth.username || "") + ":" + (auth.password ? unescape(encodeURIComponent(auth.password)) : ""))
        );
      }
      let contentType;
      if (utils_default.isFormData(data)) {
        if (platform_default.hasStandardBrowserEnv || platform_default.hasStandardBrowserWebWorkerEnv) {
          headers.setContentType(void 0);
        } else if ((contentType = headers.getContentType()) !== false) {
          const [type, ...tokens] = contentType ? contentType.split(";").map((token) => token.trim()).filter(Boolean) : [];
          headers.setContentType([type || "multipart/form-data", ...tokens].join("; "));
        }
      }
      if (platform_default.hasStandardBrowserEnv) {
        withXSRFToken && utils_default.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));
        if (withXSRFToken || withXSRFToken !== false && isURLSameOrigin_default(newConfig.url)) {
          const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies_default.read(xsrfCookieName);
          if (xsrfValue) {
            headers.set(xsrfHeaderName, xsrfValue);
          }
        }
      }
      return newConfig;
    };
  }
});
var isXHRAdapterSupported;
var xhr_default;
var init_xhr = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/adapters/xhr.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_settle();
    init_transitional();
    init_AxiosError();
    init_CanceledError();
    init_parseProtocol();
    init_platform();
    init_AxiosHeaders();
    init_progressEventReducer();
    init_resolveConfig();
    isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
    xhr_default = isXHRAdapterSupported && function(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        const _config = resolveConfig_default(config);
        let requestData = _config.data;
        const requestHeaders = AxiosHeaders_default.from(_config.headers).normalize();
        let { responseType } = _config;
        let onCanceled;
        function done() {
          if (_config.cancelToken) {
            _config.cancelToken.unsubscribe(onCanceled);
          }
          if (_config.signal) {
            _config.signal.removeEventListener("abort", onCanceled);
          }
        }
        let request = new XMLHttpRequest();
        request.open(_config.method.toUpperCase(), _config.url, true);
        request.timeout = _config.timeout;
        function onloadend() {
          if (!request) {
            return;
          }
          const responseHeaders = AxiosHeaders_default.from(
            "getAllResponseHeaders" in request && request.getAllResponseHeaders()
          );
          const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
          const response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config,
            request
          };
          settle(function _resolve(value) {
            resolve(value);
            done();
          }, function _reject(err) {
            reject(err);
            done();
          }, response);
          request = null;
        }
        if ("onloadend" in request) {
          request.onloadend = onloadend;
        } else {
          request.onreadystatechange = function handleLoad() {
            if (!request || request.readyState !== 4) {
              return;
            }
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
              return;
            }
            setTimeout(onloadend);
          };
        }
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }
          reject(new AxiosError_default("Request aborted", AxiosError_default.ECONNABORTED, _config, request));
          request = null;
        };
        request.onerror = function handleError() {
          reject(new AxiosError_default("Network Error", AxiosError_default.ERR_NETWORK, _config, request));
          request = null;
        };
        request.ontimeout = function handleTimeout() {
          let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
          const transitional2 = _config.transitional || transitional_default;
          if (_config.timeoutErrorMessage) {
            timeoutErrorMessage = _config.timeoutErrorMessage;
          }
          reject(new AxiosError_default(
            timeoutErrorMessage,
            transitional2.clarifyTimeoutError ? AxiosError_default.ETIMEDOUT : AxiosError_default.ECONNABORTED,
            _config,
            request
          ));
          request = null;
        };
        requestData === void 0 && requestHeaders.setContentType(null);
        if ("setRequestHeader" in request) {
          utils_default.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
            request.setRequestHeader(key, val);
          });
        }
        if (!utils_default.isUndefined(_config.withCredentials)) {
          request.withCredentials = !!_config.withCredentials;
        }
        if (responseType && responseType !== "json") {
          request.responseType = _config.responseType;
        }
        if (typeof _config.onDownloadProgress === "function") {
          request.addEventListener("progress", progressEventReducer_default(_config.onDownloadProgress, true));
        }
        if (typeof _config.onUploadProgress === "function" && request.upload) {
          request.upload.addEventListener("progress", progressEventReducer_default(_config.onUploadProgress));
        }
        if (_config.cancelToken || _config.signal) {
          onCanceled = (cancel) => {
            if (!request) {
              return;
            }
            reject(!cancel || cancel.type ? new CanceledError_default(null, config, request) : cancel);
            request.abort();
            request = null;
          };
          _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
          if (_config.signal) {
            _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
          }
        }
        const protocol = parseProtocol(_config.url);
        if (protocol && platform_default.protocols.indexOf(protocol) === -1) {
          reject(new AxiosError_default("Unsupported protocol " + protocol + ":", AxiosError_default.ERR_BAD_REQUEST, config));
          return;
        }
        request.send(requestData || null);
      });
    };
  }
});
var composeSignals;
var composeSignals_default;
var init_composeSignals = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/composeSignals.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_CanceledError();
    init_AxiosError();
    composeSignals = (signals, timeout) => {
      let controller = new AbortController();
      let aborted;
      const onabort = function(cancel) {
        if (!aborted) {
          aborted = true;
          unsubscribe();
          const err = cancel instanceof Error ? cancel : this.reason;
          controller.abort(err instanceof AxiosError_default ? err : new CanceledError_default(err instanceof Error ? err.message : err));
        }
      };
      let timer = timeout && setTimeout(() => {
        onabort(new AxiosError_default(`timeout ${timeout} of ms exceeded`, AxiosError_default.ETIMEDOUT));
      }, timeout);
      const unsubscribe = () => {
        if (signals) {
          timer && clearTimeout(timer);
          timer = null;
          signals.forEach((signal2) => {
            signal2 && (signal2.removeEventListener ? signal2.removeEventListener("abort", onabort) : signal2.unsubscribe(onabort));
          });
          signals = null;
        }
      };
      signals.forEach((signal2) => signal2 && signal2.addEventListener && signal2.addEventListener("abort", onabort));
      const { signal } = controller;
      signal.unsubscribe = unsubscribe;
      return [signal, () => {
        timer && clearTimeout(timer);
        timer = null;
      }];
    };
    composeSignals_default = composeSignals;
  }
});
var streamChunk;
var readBytes;
var trackStream;
var init_trackStream = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/trackStream.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    streamChunk = function* (chunk, chunkSize) {
      let len = chunk.byteLength;
      if (!chunkSize || len < chunkSize) {
        yield chunk;
        return;
      }
      let pos = 0;
      let end;
      while (pos < len) {
        end = pos + chunkSize;
        yield chunk.slice(pos, end);
        pos = end;
      }
    };
    readBytes = async function* (iterable, chunkSize, encode3) {
      for await (const chunk of iterable) {
        yield* streamChunk(ArrayBuffer.isView(chunk) ? chunk : await encode3(String(chunk)), chunkSize);
      }
    };
    trackStream = (stream, chunkSize, onProgress, onFinish, encode3) => {
      const iterator = readBytes(stream, chunkSize, encode3);
      let bytes = 0;
      return new ReadableStream({
        type: "bytes",
        async pull(controller) {
          const { done, value } = await iterator.next();
          if (done) {
            controller.close();
            onFinish();
            return;
          }
          let len = value.byteLength;
          onProgress && onProgress(bytes += len);
          controller.enqueue(new Uint8Array(value));
        },
        cancel(reason) {
          onFinish(reason);
          return iterator.return();
        }
      }, {
        highWaterMark: 2
      });
    };
  }
});
var fetchProgressDecorator;
var isFetchSupported;
var isReadableStreamSupported;
var encodeText;
var supportsRequestStream;
var DEFAULT_CHUNK_SIZE;
var supportsResponseStream;
var resolvers;
var getBodyLength;
var resolveBodyLength;
var fetch_default;
var init_fetch2 = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/adapters/fetch.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_platform();
    init_utils4();
    init_AxiosError();
    init_composeSignals();
    init_trackStream();
    init_AxiosHeaders();
    init_progressEventReducer();
    init_resolveConfig();
    init_settle();
    fetchProgressDecorator = (total, fn) => {
      const lengthComputable = total != null;
      return (loaded) => setTimeout(() => fn({
        lengthComputable,
        total,
        loaded
      }));
    };
    isFetchSupported = typeof fetch === "function" && typeof Request === "function" && typeof Response === "function";
    isReadableStreamSupported = isFetchSupported && typeof ReadableStream === "function";
    encodeText = isFetchSupported && (typeof TextEncoder === "function" ? ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) : async (str) => new Uint8Array(await new Response(str).arrayBuffer()));
    supportsRequestStream = isReadableStreamSupported && (() => {
      let duplexAccessed = false;
      const hasContentType = new Request(platform_default.origin, {
        body: new ReadableStream(),
        method: "POST",
        get duplex() {
          duplexAccessed = true;
          return "half";
        }
      }).headers.has("Content-Type");
      return duplexAccessed && !hasContentType;
    })();
    DEFAULT_CHUNK_SIZE = 64 * 1024;
    supportsResponseStream = isReadableStreamSupported && !!(() => {
      try {
        return utils_default.isReadableStream(new Response("").body);
      } catch (err) {
      }
    })();
    resolvers = {
      stream: supportsResponseStream && ((res) => res.body)
    };
    isFetchSupported && ((res) => {
      ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
        !resolvers[type] && (resolvers[type] = utils_default.isFunction(res[type]) ? (res2) => res2[type]() : (_, config) => {
          throw new AxiosError_default(`Response type '${type}' is not supported`, AxiosError_default.ERR_NOT_SUPPORT, config);
        });
      });
    })(new Response());
    getBodyLength = async (body) => {
      if (body == null) {
        return 0;
      }
      if (utils_default.isBlob(body)) {
        return body.size;
      }
      if (utils_default.isSpecCompliantForm(body)) {
        return (await new Request(body).arrayBuffer()).byteLength;
      }
      if (utils_default.isArrayBufferView(body)) {
        return body.byteLength;
      }
      if (utils_default.isURLSearchParams(body)) {
        body = body + "";
      }
      if (utils_default.isString(body)) {
        return (await encodeText(body)).byteLength;
      }
    };
    resolveBodyLength = async (headers, body) => {
      const length = utils_default.toFiniteNumber(headers.getContentLength());
      return length == null ? getBodyLength(body) : length;
    };
    fetch_default = isFetchSupported && (async (config) => {
      let {
        url,
        method,
        data,
        signal,
        cancelToken,
        timeout,
        onDownloadProgress,
        onUploadProgress,
        responseType,
        headers,
        withCredentials = "same-origin",
        fetchOptions
      } = resolveConfig_default(config);
      responseType = responseType ? (responseType + "").toLowerCase() : "text";
      let [composedSignal, stopTimeout] = signal || cancelToken || timeout ? composeSignals_default([signal, cancelToken], timeout) : [];
      let finished, request;
      const onFinish = () => {
        !finished && setTimeout(() => {
          composedSignal && composedSignal.unsubscribe();
        });
        finished = true;
      };
      let requestContentLength;
      try {
        if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
          let _request = new Request(url, {
            method: "POST",
            body: data,
            duplex: "half"
          });
          let contentTypeHeader;
          if (utils_default.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
            headers.setContentType(contentTypeHeader);
          }
          if (_request.body) {
            data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, fetchProgressDecorator(
              requestContentLength,
              progressEventReducer_default(onUploadProgress)
            ), null, encodeText);
          }
        }
        if (!utils_default.isString(withCredentials)) {
          withCredentials = withCredentials ? "cors" : "omit";
        }
        request = new Request(url, {
          ...fetchOptions,
          signal: composedSignal,
          method: method.toUpperCase(),
          headers: headers.normalize().toJSON(),
          body: data,
          duplex: "half",
          withCredentials
        });
        let response = await fetch(request);
        const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
        if (supportsResponseStream && (onDownloadProgress || isStreamResponse)) {
          const options = {};
          ["status", "statusText", "headers"].forEach((prop) => {
            options[prop] = response[prop];
          });
          const responseContentLength = utils_default.toFiniteNumber(response.headers.get("content-length"));
          response = new Response(
            trackStream(response.body, DEFAULT_CHUNK_SIZE, onDownloadProgress && fetchProgressDecorator(
              responseContentLength,
              progressEventReducer_default(onDownloadProgress, true)
            ), isStreamResponse && onFinish, encodeText),
            options
          );
        }
        responseType = responseType || "text";
        let responseData = await resolvers[utils_default.findKey(resolvers, responseType) || "text"](response, config);
        !isStreamResponse && onFinish();
        stopTimeout && stopTimeout();
        return await new Promise((resolve, reject) => {
          settle(resolve, reject, {
            data: responseData,
            headers: AxiosHeaders_default.from(response.headers),
            status: response.status,
            statusText: response.statusText,
            config,
            request
          });
        });
      } catch (err) {
        onFinish();
        if (err && err.name === "TypeError" && /fetch/i.test(err.message)) {
          throw Object.assign(
            new AxiosError_default("Network Error", AxiosError_default.ERR_NETWORK, config, request),
            {
              cause: err.cause || err
            }
          );
        }
        throw AxiosError_default.from(err, err && err.code, config, request);
      }
    });
  }
});
var knownAdapters;
var renderReason;
var isResolvedHandle;
var adapters_default;
var init_adapters = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/adapters/adapters.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_null();
    init_xhr();
    init_fetch2();
    init_AxiosError();
    knownAdapters = {
      http: null_default,
      xhr: xhr_default,
      fetch: fetch_default
    };
    utils_default.forEach(knownAdapters, (fn, value) => {
      if (fn) {
        try {
          Object.defineProperty(fn, "name", { value });
        } catch (e) {
        }
        Object.defineProperty(fn, "adapterName", { value });
      }
    });
    renderReason = (reason) => `- ${reason}`;
    isResolvedHandle = (adapter) => utils_default.isFunction(adapter) || adapter === null || adapter === false;
    adapters_default = {
      getAdapter: (adapters) => {
        adapters = utils_default.isArray(adapters) ? adapters : [adapters];
        const { length } = adapters;
        let nameOrAdapter;
        let adapter;
        const rejectedReasons = {};
        for (let i = 0; i < length; i++) {
          nameOrAdapter = adapters[i];
          let id;
          adapter = nameOrAdapter;
          if (!isResolvedHandle(nameOrAdapter)) {
            adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
            if (adapter === void 0) {
              throw new AxiosError_default(`Unknown adapter '${id}'`);
            }
          }
          if (adapter) {
            break;
          }
          rejectedReasons[id || "#" + i] = adapter;
        }
        if (!adapter) {
          const reasons = Object.entries(rejectedReasons).map(
            ([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
          );
          let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
          throw new AxiosError_default(
            `There is no suitable adapter to dispatch the request ` + s,
            "ERR_NOT_SUPPORT"
          );
        }
        return adapter;
      },
      adapters: knownAdapters
    };
  }
});
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError_default(null, config);
  }
}
function dispatchRequest(config) {
  throwIfCancellationRequested(config);
  config.headers = AxiosHeaders_default.from(config.headers);
  config.data = transformData.call(
    config,
    config.transformRequest
  );
  if (["post", "put", "patch"].indexOf(config.method) !== -1) {
    config.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter = adapters_default.getAdapter(config.adapter || defaults_default.adapter);
  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);
    response.data = transformData.call(
      config,
      config.transformResponse,
      response
    );
    response.headers = AxiosHeaders_default.from(response.headers);
    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          config.transformResponse,
          reason.response
        );
        reason.response.headers = AxiosHeaders_default.from(reason.response.headers);
      }
    }
    return Promise.reject(reason);
  });
}
var init_dispatchRequest = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/core/dispatchRequest.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_transformData();
    init_isCancel();
    init_defaults();
    init_CanceledError();
    init_AxiosHeaders();
    init_adapters();
  }
});
var VERSION;
var init_data = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/env/data.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    VERSION = "1.7.2";
  }
});
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object") {
    throw new AxiosError_default("options must be an object", AxiosError_default.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator = schema[opt];
    if (validator) {
      const value = options[opt];
      const result = value === void 0 || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError_default("option " + opt + " must be " + result, AxiosError_default.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError_default("Unknown option " + opt, AxiosError_default.ERR_BAD_OPTION);
    }
  }
}
var validators;
var deprecatedWarnings;
var validator_default;
var init_validator = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/validator.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_data();
    init_AxiosError();
    validators = {};
    ["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
      validators[type] = function validator(thing) {
        return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
      };
    });
    deprecatedWarnings = {};
    validators.transitional = function transitional(validator, version2, message) {
      function formatMessage(opt, desc2) {
        return "[Axios v" + VERSION + "] Transitional option '" + opt + "'" + desc2 + (message ? ". " + message : "");
      }
      return (value, opt, opts) => {
        if (validator === false) {
          throw new AxiosError_default(
            formatMessage(opt, " has been removed" + (version2 ? " in " + version2 : "")),
            AxiosError_default.ERR_DEPRECATED
          );
        }
        if (version2 && !deprecatedWarnings[opt]) {
          deprecatedWarnings[opt] = true;
          console.warn(
            formatMessage(
              opt,
              " has been deprecated since v" + version2 + " and will be removed in the near future"
            )
          );
        }
        return validator ? validator(value, opt, opts) : true;
      };
    };
    validator_default = {
      assertOptions,
      validators
    };
  }
});
var validators2;
var Axios;
var Axios_default;
var init_Axios = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/core/Axios.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_buildURL();
    init_InterceptorManager();
    init_dispatchRequest();
    init_mergeConfig();
    init_buildFullPath();
    init_validator();
    init_AxiosHeaders();
    validators2 = validator_default.validators;
    Axios = class {
      constructor(instanceConfig) {
        this.defaults = instanceConfig;
        this.interceptors = {
          request: new InterceptorManager_default(),
          response: new InterceptorManager_default()
        };
      }
      /**
       * Dispatch a request
       *
       * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
       * @param {?Object} config
       *
       * @returns {Promise} The Promise to be fulfilled
       */
      async request(configOrUrl, config) {
        try {
          return await this._request(configOrUrl, config);
        } catch (err) {
          if (err instanceof Error) {
            let dummy;
            Error.captureStackTrace ? Error.captureStackTrace(dummy = {}) : dummy = new Error();
            const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, "") : "";
            try {
              if (!err.stack) {
                err.stack = stack;
              } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ""))) {
                err.stack += "\n" + stack;
              }
            } catch (e) {
            }
          }
          throw err;
        }
      }
      _request(configOrUrl, config) {
        if (typeof configOrUrl === "string") {
          config = config || {};
          config.url = configOrUrl;
        } else {
          config = configOrUrl || {};
        }
        config = mergeConfig(this.defaults, config);
        const { transitional: transitional2, paramsSerializer, headers } = config;
        if (transitional2 !== void 0) {
          validator_default.assertOptions(transitional2, {
            silentJSONParsing: validators2.transitional(validators2.boolean),
            forcedJSONParsing: validators2.transitional(validators2.boolean),
            clarifyTimeoutError: validators2.transitional(validators2.boolean)
          }, false);
        }
        if (paramsSerializer != null) {
          if (utils_default.isFunction(paramsSerializer)) {
            config.paramsSerializer = {
              serialize: paramsSerializer
            };
          } else {
            validator_default.assertOptions(paramsSerializer, {
              encode: validators2.function,
              serialize: validators2.function
            }, true);
          }
        }
        config.method = (config.method || this.defaults.method || "get").toLowerCase();
        let contextHeaders = headers && utils_default.merge(
          headers.common,
          headers[config.method]
        );
        headers && utils_default.forEach(
          ["delete", "get", "head", "post", "put", "patch", "common"],
          (method) => {
            delete headers[method];
          }
        );
        config.headers = AxiosHeaders_default.concat(contextHeaders, headers);
        const requestInterceptorChain = [];
        let synchronousRequestInterceptors = true;
        this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
          if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
            return;
          }
          synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
          requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
        });
        const responseInterceptorChain = [];
        this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
          responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
        });
        let promise;
        let i = 0;
        let len;
        if (!synchronousRequestInterceptors) {
          const chain = [dispatchRequest.bind(this), void 0];
          chain.unshift.apply(chain, requestInterceptorChain);
          chain.push.apply(chain, responseInterceptorChain);
          len = chain.length;
          promise = Promise.resolve(config);
          while (i < len) {
            promise = promise.then(chain[i++], chain[i++]);
          }
          return promise;
        }
        len = requestInterceptorChain.length;
        let newConfig = config;
        i = 0;
        while (i < len) {
          const onFulfilled = requestInterceptorChain[i++];
          const onRejected = requestInterceptorChain[i++];
          try {
            newConfig = onFulfilled(newConfig);
          } catch (error) {
            onRejected.call(this, error);
            break;
          }
        }
        try {
          promise = dispatchRequest.call(this, newConfig);
        } catch (error) {
          return Promise.reject(error);
        }
        i = 0;
        len = responseInterceptorChain.length;
        while (i < len) {
          promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
        }
        return promise;
      }
      getUri(config) {
        config = mergeConfig(this.defaults, config);
        const fullPath = buildFullPath(config.baseURL, config.url);
        return buildURL(fullPath, config.params, config.paramsSerializer);
      }
    };
    utils_default.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method,
          url,
          data: (config || {}).data
        }));
      };
    });
    utils_default.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
      function generateHTTPMethod(isForm) {
        return function httpMethod(url, data, config) {
          return this.request(mergeConfig(config || {}, {
            method,
            headers: isForm ? {
              "Content-Type": "multipart/form-data"
            } : {},
            url,
            data
          }));
        };
      }
      Axios.prototype[method] = generateHTTPMethod();
      Axios.prototype[method + "Form"] = generateHTTPMethod(true);
    });
    Axios_default = Axios;
  }
});
var CancelToken;
var CancelToken_default;
var init_CancelToken = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/cancel/CancelToken.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_CanceledError();
    CancelToken = class {
      constructor(executor) {
        if (typeof executor !== "function") {
          throw new TypeError("executor must be a function.");
        }
        let resolvePromise;
        this.promise = new Promise(function promiseExecutor(resolve) {
          resolvePromise = resolve;
        });
        const token = this;
        this.promise.then((cancel) => {
          if (!token._listeners)
            return;
          let i = token._listeners.length;
          while (i-- > 0) {
            token._listeners[i](cancel);
          }
          token._listeners = null;
        });
        this.promise.then = (onfulfilled) => {
          let _resolve;
          const promise = new Promise((resolve) => {
            token.subscribe(resolve);
            _resolve = resolve;
          }).then(onfulfilled);
          promise.cancel = function reject() {
            token.unsubscribe(_resolve);
          };
          return promise;
        };
        executor(function cancel(message, config, request) {
          if (token.reason) {
            return;
          }
          token.reason = new CanceledError_default(message, config, request);
          resolvePromise(token.reason);
        });
      }
      /**
       * Throws a `CanceledError` if cancellation has been requested.
       */
      throwIfRequested() {
        if (this.reason) {
          throw this.reason;
        }
      }
      /**
       * Subscribe to the cancel signal
       */
      subscribe(listener) {
        if (this.reason) {
          listener(this.reason);
          return;
        }
        if (this._listeners) {
          this._listeners.push(listener);
        } else {
          this._listeners = [listener];
        }
      }
      /**
       * Unsubscribe from the cancel signal
       */
      unsubscribe(listener) {
        if (!this._listeners) {
          return;
        }
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }
      /**
       * Returns an object that contains a new `CancelToken` and a function that, when called,
       * cancels the `CancelToken`.
       */
      static source() {
        let cancel;
        const token = new CancelToken(function executor(c) {
          cancel = c;
        });
        return {
          token,
          cancel
        };
      }
    };
    CancelToken_default = CancelToken;
  }
});
function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}
var init_spread = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/spread.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
  }
});
function isAxiosError(payload) {
  return utils_default.isObject(payload) && payload.isAxiosError === true;
}
var init_isAxiosError = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/isAxiosError.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
  }
});
var HttpStatusCode;
var HttpStatusCode_default;
var init_HttpStatusCode = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/helpers/HttpStatusCode.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    HttpStatusCode = {
      Continue: 100,
      SwitchingProtocols: 101,
      Processing: 102,
      EarlyHints: 103,
      Ok: 200,
      Created: 201,
      Accepted: 202,
      NonAuthoritativeInformation: 203,
      NoContent: 204,
      ResetContent: 205,
      PartialContent: 206,
      MultiStatus: 207,
      AlreadyReported: 208,
      ImUsed: 226,
      MultipleChoices: 300,
      MovedPermanently: 301,
      Found: 302,
      SeeOther: 303,
      NotModified: 304,
      UseProxy: 305,
      Unused: 306,
      TemporaryRedirect: 307,
      PermanentRedirect: 308,
      BadRequest: 400,
      Unauthorized: 401,
      PaymentRequired: 402,
      Forbidden: 403,
      NotFound: 404,
      MethodNotAllowed: 405,
      NotAcceptable: 406,
      ProxyAuthenticationRequired: 407,
      RequestTimeout: 408,
      Conflict: 409,
      Gone: 410,
      LengthRequired: 411,
      PreconditionFailed: 412,
      PayloadTooLarge: 413,
      UriTooLong: 414,
      UnsupportedMediaType: 415,
      RangeNotSatisfiable: 416,
      ExpectationFailed: 417,
      ImATeapot: 418,
      MisdirectedRequest: 421,
      UnprocessableEntity: 422,
      Locked: 423,
      FailedDependency: 424,
      TooEarly: 425,
      UpgradeRequired: 426,
      PreconditionRequired: 428,
      TooManyRequests: 429,
      RequestHeaderFieldsTooLarge: 431,
      UnavailableForLegalReasons: 451,
      InternalServerError: 500,
      NotImplemented: 501,
      BadGateway: 502,
      ServiceUnavailable: 503,
      GatewayTimeout: 504,
      HttpVersionNotSupported: 505,
      VariantAlsoNegotiates: 506,
      InsufficientStorage: 507,
      LoopDetected: 508,
      NotExtended: 510,
      NetworkAuthenticationRequired: 511
    };
    Object.entries(HttpStatusCode).forEach(([key, value]) => {
      HttpStatusCode[value] = key;
    });
    HttpStatusCode_default = HttpStatusCode;
  }
});
function createInstance(defaultConfig) {
  const context = new Axios_default(defaultConfig);
  const instance = bind(Axios_default.prototype.request, context);
  utils_default.extend(instance, Axios_default.prototype, context, { allOwnKeys: true });
  utils_default.extend(instance, context, null, { allOwnKeys: true });
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };
  return instance;
}
var axios;
var axios_default;
var init_axios = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/lib/axios.js"() {
    "use strict";
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_utils4();
    init_bind();
    init_Axios();
    init_mergeConfig();
    init_defaults();
    init_formDataToJSON();
    init_CanceledError();
    init_CancelToken();
    init_isCancel();
    init_data();
    init_toFormData();
    init_AxiosError();
    init_spread();
    init_isAxiosError();
    init_AxiosHeaders();
    init_adapters();
    init_HttpStatusCode();
    axios = createInstance(defaults_default);
    axios.Axios = Axios_default;
    axios.CanceledError = CanceledError_default;
    axios.CancelToken = CancelToken_default;
    axios.isCancel = isCancel;
    axios.VERSION = VERSION;
    axios.toFormData = toFormData_default;
    axios.AxiosError = AxiosError_default;
    axios.Cancel = axios.CanceledError;
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;
    axios.isAxiosError = isAxiosError;
    axios.mergeConfig = mergeConfig;
    axios.AxiosHeaders = AxiosHeaders_default;
    axios.formToJSON = (thing) => formDataToJSON_default(utils_default.isHTMLForm(thing) ? new FormData(thing) : thing);
    axios.getAdapter = adapters_default.getAdapter;
    axios.HttpStatusCode = HttpStatusCode_default;
    axios.default = axios;
    axios_default = axios;
  }
});
var Axios2;
var AxiosError2;
var CanceledError2;
var isCancel2;
var CancelToken2;
var VERSION2;
var all2;
var Cancel;
var isAxiosError2;
var spread2;
var toFormData2;
var AxiosHeaders2;
var HttpStatusCode2;
var formToJSON;
var getAdapter;
var mergeConfig2;
var init_axios2 = __esm({
  "../../node_modules/.pnpm/axios@1.7.2/node_modules/axios/index.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_axios();
    ({
      Axios: Axios2,
      AxiosError: AxiosError2,
      CanceledError: CanceledError2,
      isCancel: isCancel2,
      CancelToken: CancelToken2,
      VERSION: VERSION2,
      all: all2,
      Cancel,
      isAxiosError: isAxiosError2,
      spread: spread2,
      toFormData: toFormData2,
      AxiosHeaders: AxiosHeaders2,
      HttpStatusCode: HttpStatusCode2,
      formToJSON,
      getAdapter,
      mergeConfig: mergeConfig2
    } = axios_default);
  }
});
var ZITADEL_INTROSPECTION_ENDPOINT;
var ZITADEL_CLIENT_ID;
var ZITADEL_CLIENT_SECRET;
var t;
var secure;
var router;
var publicProcedure;
var secureProcedure;
var init_trpc = __esm({
  "../dist/config/trpc.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_dist();
    init_dist4();
    init_axios2();
    init_envs();
    init_schema();
    ({ ZITADEL_INTROSPECTION_ENDPOINT, ZITADEL_CLIENT_ID, ZITADEL_CLIENT_SECRET } = getAllEnvs());
    t = initTRPC.context().create({
      transformer: SuperJSON
    });
    secure = t.middleware(async ({ next, ctx }) => {
      const authHeader = ctx.req.headers.get("Authorization");
      if (!authHeader) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No authorization header provided"
        });
      }
      const token = authHeader.split(" ")[1];
      try {
        const response = await axios_default.post(ZITADEL_INTROSPECTION_ENDPOINT, `token=${token}`, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          auth: {
            username: ZITADEL_CLIENT_ID,
            password: ZITADEL_CLIENT_SECRET
          }
        });
        if (!response.data.active) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Inactive token"
          });
        }
        return next({ ctx: { secure: true } });
      } catch (error) {
        const message = error.response ? error.response.data : error.message;
        console.error("Introspection error:", message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to introspect token: ${message}`,
          cause: error
        });
      }
    });
    router = t.router;
    publicProcedure = t.procedure;
    secureProcedure = t.procedure.use(secure);
  }
});
var secureRouter;
var init_router2 = __esm({
  "../dist/routes/secure/router.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_trpc();
    init_lib();
    secureRouter = router({
      test: secureProcedure.input(z.string()).query(async (opt) => {
        console.log("opt.input:", opt.input);
        return { secure: opt.ctx.secure, input: opt.input };
      })
    });
  }
});
var postValidator;
var profileValidator;
var userValidator;
var userRouter;
var init_router3 = __esm({
  "../dist/routes/user/router.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_trpc();
    init_schema();
    init_lib();
    init_drizzle_orm();
    postValidator = z.object({
      title: z.string(),
      body: z.string(),
      slug: z.string()
    });
    profileValidator = z.object({
      bio: z.string()
    });
    userValidator = z.object({
      name: z.union([z.string(), z.null()]),
      email: z.string().email("This is not a valid email."),
      posts: postValidator.optional(),
      profile: profileValidator.optional()
      // profile: z.object({ create: profileValidator }).optional()
    });
    userRouter = router({
      insert: publicProcedure.input(userValidator).mutation(async ({ input, ctx: { db } }) => {
        const { profile: sentProfile, posts: sentPosts, ...userData } = input;
        const newUser = await db.insert(users).values(userData).returning({ user_id: users.userId, name: users.name });
        if (!newUser[0])
          throw "did not return a user id";
        const newUserId = newUser[0].user_id;
        if (sentProfile)
          await db.insert(profiles).values({
            userId: newUserId,
            ...sentProfile
          }).execute();
        if (sentPosts)
          await db.insert(posts).values({
            userId: newUserId,
            ...sentPosts
          }).execute();
        const allUsersQ = db.query.users.findMany({
          with: {
            posts: true,
            profile: true
          }
        });
        const allUsersSQL = await db.select().from(users).innerJoin(profiles, eq(users.userId, profiles.userId)).leftJoin(posts, eq(users.userId, posts.userId));
        const userSQL = await db.select().from(users).where(eq(users.userId, newUserId));
        const userQ = await db.query.users.findFirst({
          where: eq(users.userId, newUserId)
        });
        console.dir({ userSQL, userQ, allUsersQ, allUsersSQL, newUser }, { depth: null });
        return "echo back: " + input;
      }),
      select: publicProcedure.input(z.object({ user_id: z.string() })).query(async ({ input: { user_id }, ctx: { db } }) => {
        const postsJunctionSQL = await db.query.posts.findFirst({
          with: {
            author: true,
            postCatagories: {
              columns: {
                postId: false,
                catagoryId: false
              },
              with: {
                postCatagories: {
                  columns: {
                    catagoryId: true,
                    catagory: true
                  }
                }
              }
            }
          }
        });
        const postsJunctionQ = await db.select().from(posts).innerJoin(catagoriesPosts, eq(posts.postId, catagoriesPosts.postId)).innerJoin(catagories, eq(catagoriesPosts.catagoryId, catagories.catagoryId));
        console.log({ postsJunctionSQL, postsJunctionQ });
        return await db.select().from(users).where(eq(users.userId, Number(user_id)));
      })
    });
  }
});
var appRouter_exports = {};
__export(appRouter_exports, {
  appRouter: () => appRouter
});
var appRouter;
var init_appRouter = __esm({
  "../dist/routes/appRouter.js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_trpc();
    init_lib();
    init_router2();
    init_router3();
    appRouter = router({
      secure: secureRouter,
      user: userRouter,
      test: publicProcedure.query(async () => {
        return "Some stuff";
      }),
      echo: publicProcedure.input(z.object({ name: z.string() })).query(async (opts) => {
        return "Echo back: " + opts.input.name;
      })
    });
  }
});
var onRequest;
var init_trpc2 = __esm({
  "trpc/[[trpc]].js"() {
    init_functionsRoutes_0_979522597160229();
    init_checked_fetch();
    init_d1();
    init_fetch();
    init_schema();
    init_envs();
    onRequest = async ({ request, env }) => {
      initEnvs(env);
      const [{ appRouter: appRouter2 }] = await Promise.all([Promise.resolve().then(() => (init_appRouter(), appRouter_exports))]);
      return fetchRequestHandler({
        endpoint: "/trpc",
        req: request,
        router: appRouter2,
        createContext: () => {
          return {
            req: request,
            db: drizzle(env.DB, { schema: schema_exports })
          };
        }
      });
    };
  }
});
var routes;
var init_functionsRoutes_0_979522597160229 = __esm({
  "../.wrangler/tmp/pages-A98Hmq/functionsRoutes-0.979522597160229.mjs"() {
    init_trpc2();
    routes = [
      {
        routePath: "/trpc/:trpc*",
        mountPath: "/trpc",
        method: "",
        middlewares: [],
        modules: [onRequest]
      }
    ];
  }
});
init_functionsRoutes_0_979522597160229();
init_checked_fetch();
init_functionsRoutes_0_979522597160229();
init_checked_fetch();
init_functionsRoutes_0_979522597160229();
init_checked_fetch();
init_functionsRoutes_0_979522597160229();
init_checked_fetch();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
function parse2(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a111 = options.prefixes, prefixes = _a111 === void 0 ? "./" : _a111;
  var defaultPattern = "[^".concat(escapeString(options.delimiter || "/#?"), "]+?");
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  };
  var mustConsume = function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a112 = tokens[i], nextType = _a112.type, index = _a112.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  };
  var consumeText = function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  };
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a111 = options.decode, decode = _a111 === void 0 ? function(x) {
    return x;
  } : _a111;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    };
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse2(path, options), keys, options);
}
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a111 = options.strict, strict = _a111 === void 0 ? false : _a111, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode3 = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith2 = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith2), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode3(token));
    } else {
      var prefix = escapeString(encode3(token.prefix));
      var suffix = escapeString(encode3(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            route += "((?:".concat(token.pattern, ")").concat(token.modifier, ")");
          } else {
            route += "(".concat(token.pattern, ")").concat(token.modifier);
          }
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    };
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = (response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
);
init_functionsRoutes_0_979522597160229();
init_checked_fetch();
var drainBody = async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
};
var middleware_ensure_req_body_drained_default = drainBody;
init_functionsRoutes_0_979522597160229();
init_checked_fetch();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
var jsonError = async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
};
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
init_functionsRoutes_0_979522597160229();
init_checked_fetch();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  };
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      };
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
};
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
var jsonError2 = async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
};
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-emdUqg/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}

// .wrangler/tmp/bundle-emdUqg/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  };
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      };
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.7541878249220604.js.map
