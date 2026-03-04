import { deepEqual, deepEqualEnv } from "./utils";

/**
 * Sorbet LSP configuration (data-only).
 */
export interface SorbetLspConfigData {
  /**
   * Configuration Id.
   */
  readonly id: string;
  /**
   * Display name suitable for short-form fields like menu items or status fields.
   */
  readonly name: string;
  /**
   * Human-readable long-form description suitable for hover text or help.
   */
  readonly description: string;
  /**
   * Environment variables to set when executing {@link command}.
   */
  readonly env: NodeJS.ProcessEnv;
  /**
   * Command and arguments to execute, e.g. `["srb", "typecheck", "--lsp"]`.
   * Required for "spawn" transport; unused for "tcp" transport.
   */
  readonly command?: ReadonlyArray<string>;
  /**
   * How to connect to the Sorbet LSP. Use "spawn" (default) to launch a
   * subprocess, or "tcp" to connect to an already-running server.
   */
  readonly transport?: "spawn" | "tcp";
  /**
   * Hostname for TCP transport (default: "localhost").
   */
  readonly host?: string;
  /**
   * Port number for TCP transport.
   */
  readonly port?: number;
}

/**
 * Sorbet LSP configuration.
 */
export class SorbetLspConfig implements SorbetLspConfigData {
  /**
   * Configuration Id.
   */
  public readonly id: string;
  /**
   * Display name suitable for short-form fields like menu items or status fields.
   */
  public readonly name: string;
  /**
   * Human-readable long-form description suitable for hover text or help.
   */
  public readonly description: string;
  /**
   * Environment variables to set when executing {@link command}.
   */
  public readonly env: NodeJS.ProcessEnv;
  /**
   * Command and arguments to execute, e.g. `["bundle", "exec", "srb", "typecheck", "--lsp"]`.
   * Required for "spawn" transport; unused for "tcp" transport.
   */
  public readonly command?: ReadonlyArray<string>;
  /**
   * How to connect to the Sorbet LSP. Use "spawn" (default) to launch a
   * subprocess, or "tcp" to connect to an already-running server.
   */
  public readonly transport?: "spawn" | "tcp";
  /**
   * Hostname for TCP transport (default: "localhost").
   */
  public readonly host?: string;
  /**
   * Port number for TCP transport.
   */
  public readonly port?: number;

  constructor(data: SorbetLspConfigData);

  constructor(id: string, name: string);
  constructor(id: string, name: string, description: string);
  constructor(
    id: string,
    name: string,
    description: string,
    env: NodeJS.ProcessEnv,
  );

  constructor(
    id: string,
    name: string,
    description: string,
    env: NodeJS.ProcessEnv,
    command: ReadonlyArray<string>,
  );

  constructor(
    idOrData: string | SorbetLspConfigData,
    name: string = "",
    description: string = "",
    env: NodeJS.ProcessEnv = {},
    command: ReadonlyArray<string> = [],
  ) {
    if (typeof idOrData === "string") {
      this.id = idOrData;
      this.name = name;
      this.description = description;
      this.env = { ...env };
      this.command = command;
    } else {
      this.id = idOrData.id;
      this.name = idOrData.name;
      this.description = idOrData.description;
      this.env = { ...idOrData.env };
      this.command = idOrData.command ? [...idOrData.command] : undefined;
      this.transport = idOrData.transport;
      this.host = idOrData.host;
      this.port = idOrData.port;
    }
  }

  public toString(): string {
    if (this.transport === "tcp") {
      const host = this.host ?? "localhost";
      return `${this.name}: ${this.description} [tcp: ${host}:${this.port}]`;
    }
    return `${this.name}: ${this.description} [cmd: "${(this.command ?? []).join(" ")}"]`;
  }

  /**
   * Deep equality.
   */
  public isEqualTo(other: any): boolean {
    if (this === other) return true;
    if (!(other instanceof SorbetLspConfig)) return false;

    return (
      this.id === other.id &&
      this.name === other.name &&
      this.description === other.description &&
      deepEqualEnv(this.env, other.env) &&
      ((this.command !== undefined && other.command !== undefined &&
      deepEqual(this.command, other.command)) || (this.command === undefined && other.command === undefined)) &&
      this.transport === other.transport &&
      this.host === other.host &&
      this.port === other.port
    );
  }

  /**
   * Deep equality, suitable for use when left and/or right may be null or undefined.
   */
  public static areEqual(
    left: SorbetLspConfig | undefined | null,
    right: SorbetLspConfig | undefined | null,
  ) {
    return left ? left.isEqualTo(right) : left === right;
  }
}
