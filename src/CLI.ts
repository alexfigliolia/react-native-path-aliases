#!/usr/bin/env node
import { CreatePackage } from "./CreatePackage";
import { Logger } from "./Logger";

(async () => {
  Logger.activate();
  const CLI = new CreatePackage();
  await CLI.execute();
})().catch(console.log);
