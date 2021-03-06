/**
 * Hover.tsx
 */

import * as Oni from "oni-api"
import * as os from "os"
import * as React from "react"
import * as types from "vscode-languageserver-types"

import { ErrorInfo } from "./../UI/components/ErrorInfo"
import { QuickInfoDocumentation, QuickInfoTitle } from "./../UI/components/QuickInfo"

import * as Helpers from "./../Plugins/Api/LanguageClient/LanguageClientHelpers"

import * as UI from "./../UI"
import * as Selectors from "./../UI/Selectors"

import { Configuration } from "./../Services/Configuration"

const HoverToolTipId = "hover-tool-tip"

export class HoverRenderer {

    constructor(
        private _editor: Oni.Editor,
        private _configuration: Configuration,
    ) {
    }

    public showQuickInfo(hover: types.Hover, errors: types.Diagnostic[]): void {
        const elem = this._renderQuickInfoElement(hover, errors)

        if (!elem) {
            return
        }

        const state: any = UI.store.getState()

        UI.Actions.showToolTip(HoverToolTipId, elem, {
            position: { pixelX: state.cursorPixelX, pixelY: state.cursorPixelY },
            openDirection: 1,
            padding: "0px",
        })
    }

    public hideQuickInfo(): void {
        UI.Actions.hideToolTip(HoverToolTipId)
    }

    private _renderQuickInfoElement(hover: types.Hover, errors: types.Diagnostic[]): JSX.Element {
        const quickInfoElements = getQuickInfoElementsFromHover(hover)

        const state: any = UI.store.getState()
        const borderColor = state.colors["toolTip.border"]

        let customErrorStyle = {}
        if (quickInfoElements.length > 0) {
            // TODO:
            customErrorStyle = {
                "border-bottom": "1px solid " + borderColor,
            }
        }

        const errorElements = getErrorElements(errors, customErrorStyle)

        const elements = [...errorElements, ...quickInfoElements]

        if (this._configuration.getValue("experimental.editor.textMateHighlighting.debugScopes")) {
            elements.push(this._getDebugScopesElement())
        }

        if (elements.length === 0) {
            return null
        }

        return <div className="quickinfo-container enable-mouse">
            <div className="quickinfo">
                <div className="container horizontal center">
                    <div className="container full">
                        {elements}
                    </div>
                </div>
            </div>
        </div>
    }

    private _getDebugScopesElement(): JSX.Element {
        const editor: any = this._editor

        if (!editor || !editor.syntaxHighlighter) {
            return null
        }

        const cursor = editor.activeBuffer.cursor
        const scopeInfo = editor.syntaxHighlighter.getHighlightTokenAt(editor.activeBuffer.id, {
            line: cursor.line,
            character: cursor.column,
        })

        if (!scopeInfo || !scopeInfo.scopes) {
            return null
        }
        const items = scopeInfo.scopes.map((si: string) => <li>{si}</li>)
        return <div className="documentation">
            <div>DEBUG: TextMate Scopes:</div>
            <ul>
                {items}
            </ul>
        </div>
    }
}

const getErrorElements = (errors: types.Diagnostic[], style: any): JSX.Element[] => {
    if (!errors || !errors.length) {
        return Selectors.EmptyArray
    } else {
        return [<ErrorInfo errors={errors} style={style} />]
    }
}

const getTitleAndContents = (result: types.Hover) => {
    if (!result || !result.contents) {
        return null
    }

    const contents = Helpers.getTextFromContents(result.contents)

    if (contents.length === 0) {
        return null
    } else if (contents.length === 1 && contents[0]) {
        const title = contents[0].trim()

        if (!title) {
            return null
        }

        return {
            title,
            description: "",
        }
    } else {

        const description = [...contents]
        description.shift()
        const descriptionContent = description.join(os.EOL)

        return {
            title: contents[0],
            description: descriptionContent,
        }
    }
}

const getQuickInfoElementsFromHover = (hover: types.Hover): JSX.Element[] => {
    const titleAndContents = getTitleAndContents(hover)

    if (!titleAndContents) {
        return Selectors.EmptyArray
    }

    return [
        <QuickInfoTitle text={titleAndContents.title} />,
        <QuickInfoDocumentation text={titleAndContents.description} />,
    ]
}
