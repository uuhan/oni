import * as ChildProcess from "child_process"
import * as shellEnv from "shell-env"

import * as Platform from "./../../Platform"
import { configuration } from "./../../Services/Configuration"

const getPathSeparator = () => {
    return Platform.isWindows() ? ";" : ":"
}

const mergePathEnvironmentVariable = (currentPath: string, pathsToAdd: string[]): string => {
    if (!pathsToAdd || !pathsToAdd.length) {
        return currentPath
    }

    const separator = getPathSeparator()

    const joinedPathsToAdd = pathsToAdd.join(separator)

    return currentPath + separator + joinedPathsToAdd
}

const mergeSpawnOptions = async (originalSpawnOptions: ChildProcess.ExecOptions | ChildProcess.SpawnOptions): Promise<any> => {
    let existingPath: string

    try {
        const shellEnvironment = await shellEnv()
        process.env = { ...process.env, ...shellEnvironment }
        existingPath = process.env.Path || process.env.PATH
    } catch (e) {
        existingPath = process.env.Path || process.env.PATH
    }

    const requiredOptions = {
        env: {
            ...process.env,
            ...originalSpawnOptions.env,
        },
    }

    requiredOptions.env.PATH = mergePathEnvironmentVariable(existingPath, configuration.getValue("environment.additionalPaths"))

    return {
        ...originalSpawnOptions,
        ...requiredOptions,
    }
}

/**
 * API surface area responsible for handling process-related tasks
 * (spawning processes, managing running process, etc)
 */
export const execNodeScript = async (scriptPath: string, args: string[] = [], options: ChildProcess.ExecOptions = {}, callback: (err: any, stdout: string, stderr: string) => void): Promise<ChildProcess.ChildProcess> => {
    const spawnOptions = await mergeSpawnOptions(options)
    spawnOptions.env.ELECTRON_RUN_AS_NODE = 1

    const execOptions = [process.execPath, scriptPath].concat(args)
    const execString = execOptions.map((s) => `"${s}"`).join(" ")

    return ChildProcess.exec(execString, spawnOptions, callback)
}

/**
 * Wrapper around `child_process.exec` to run using electron as opposed to node
 */
export const spawnNodeScript = async (scriptPath: string, args: string[] = [], options: ChildProcess.SpawnOptions = {}): Promise<ChildProcess.ChildProcess> => {
    const spawnOptions = await mergeSpawnOptions(options)
    spawnOptions.env.ELECTRON_RUN_AS_NODE = 1

    const allArgs = [scriptPath].concat(args)

    return ChildProcess.spawn(process.execPath, allArgs, spawnOptions)
}

/**
 * Spawn process - wrapper around `child_process.spawn`
 */
export const spawnProcess = async (startCommand: string, args: string[] = [], options: ChildProcess.SpawnOptions = {}): Promise<ChildProcess.ChildProcess> => {
    const spawnOptions = await mergeSpawnOptions(options)

    return ChildProcess.spawn(startCommand, args, spawnOptions)
    }
