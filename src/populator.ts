import {PopulateOptions} from "mongoose";

export interface FernsPopulatorOptions extends Pick<PopulateOptions, "path" | "select"> {}
