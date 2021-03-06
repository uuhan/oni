/**
 * Mocks/index.ts
 *
 * Implementations of test mocks and doubles,
 * to exercise boundaries of class implementations
 */

import * as Oni from "oni-api"

import * as types from "vscode-languageserver-types"

import { Editor } from "./../../src/Editor/Editor"
import * as Language from "./../../src/Services/Language"
import { createCompletablePromise, ICompletablePromise } from "./../../src/Utility"

export class MockConfiguration {

    constructor(
        private _configurationValues: any = {},
    ) {}

    public getValue(key: string): any {
        return this._configurationValues[key]
    }

    public setValue(key: string, value: any): void {
        this._configurationValues[key] = value
    }
}

export class MockEditor extends Editor {

    private _activeBuffer: MockBuffer = null

    public get activeBuffer(): Oni.Buffer {
        return this._activeBuffer as any
    }

    public simulateModeChange(newMode: string): void {
        this.setMode(newMode as any)
    }

    public simulateCursorMoved(line: number, column: number): void {
        this.notifyCursorMoved({
            line,
            column,
        })
    }

    public simulateBufferEnter(buffer: MockBuffer): void {
        this._activeBuffer = buffer
        this.notifyBufferEnter(buffer as any)
    }

    public setActiveBufferLine(line: number, lineContents: string): void {
        this._activeBuffer.setLineSync(line, lineContents)

        this.notifyBufferChanged({
            buffer: this._activeBuffer as any,
            contentChanges: [{
                range: types.Range.create(line, 0, line + 1, 0),
                text: lineContents,
            }],
        })
    }
}

export class MockBuffer {

    public get language(): string {
        return this._language
    }

    public get filePath(): string {
        return this._filePath
    }

    public get lineCount(): number {
        return this._lines.length
    }

    public constructor(
        private _language: string = "test_language",
        private _filePath: string = "test_filepath",
        private _lines: string[] = [],
    ) {
    }

    public setLinesSync(lines: string[]): void {
        this._lines = lines
    }

    public setLineSync(line: number, lineContents: string): void {

        while (this._lines.length <= line) {
            this._lines.push("")
        }

        this._lines[line] = lineContents
    }

    public getLines(start: number = 0, end?: number): Promise<string[]> {
        if (typeof end !== "number") {
            end = this._lines.length
        }

        return Promise.resolve(this._lines.slice(start, end))
    }
}

const DefaultCursorMatchRegEx = /[a-z]/i
const DefaultTriggerCharacters = ["."]

export class MockLanguageManager {
    public getTokenRegex(language: string): RegExp {
        return DefaultCursorMatchRegEx
    }

    public getCompletionTriggerCharacters(language: string): string[] {
        return DefaultTriggerCharacters
    }
}

export class MockRequestor<T> {

    private _completablePromises: Array<ICompletablePromise<T>> = []

    public get pendingCallCount(): number {
        return this._completablePromises.length
    }

    public get(...args: any[]): Promise<T> {

        const newPromise = createCompletablePromise<T>()

        this._completablePromises.push(newPromise)

        return newPromise.promise
    }

    public resolve(val: T): void {
        const firstPromise = this._completablePromises.shift()
        firstPromise.resolve(val)
    }
}

export class MockDefinitionRequestor extends MockRequestor<Language.IDefinitionResult> implements Language.IDefinitionRequestor {
    public getDefinition(language: string, filePath: string, line: number, column: number): Promise<Language.IDefinitionResult> {
        return this.get(language, filePath, line, column)
    }
}

export class MockHoverRequestor extends MockRequestor<Language.IHoverResult> implements Language.IHoverRequestor {
    public getHover(language: string, filePath: string, line: number, column: number): Promise<Language.IHoverResult> {
        return this.get(language, filePath, line, column)
    }
}
