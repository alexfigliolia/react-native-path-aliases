#!/usr/bin/env node
import { CreatePackage } from "./CreatePackage";

(async () => {
  const CLI = new CreatePackage();
  await CLI.execute();
})().catch(console.log);
