import * as vscode from 'vscode';
import { ArrivalHistoryProvider } from './arrivalHistoryProvider';
import { ArrivalRecorder } from './arrivalRecorder';
import { parseArrivalFromEditorState } from './util';
import { SortField, SortOrder, TreeItemInterface } from './arrival';
import { ArrivalDecorationProvider } from './arrivalDecorationProvider';
import { ArrivalStatusBarItem } from './arrivalStatusBarItem';


export class ViewUpdater {
    private treeView: vscode.TreeView<TreeItemInterface | null | undefined>;
    private recorder: ArrivalRecorder;
    private arrivalHistoryProvider: ArrivalHistoryProvider;
    private decorationProvider: ArrivalDecorationProvider;
    private statusBarItem: ArrivalStatusBarItem;
    private paused: boolean = false;

    constructor(
        treeView: vscode.TreeView<TreeItemInterface | null | undefined>,
        recorder: ArrivalRecorder,
        arrivalHistoryProvider: ArrivalHistoryProvider,
        decorationProvider: ArrivalDecorationProvider,
        statusBarItem: ArrivalStatusBarItem,
    ) {
        this.treeView = treeView;
        this.recorder = recorder;
        this.arrivalHistoryProvider = arrivalHistoryProvider;
        this.decorationProvider = decorationProvider;
        this.statusBarItem = statusBarItem;
    }

    togglePauseState() {
        this.paused = !this.paused;
    }

    get pausedState(): boolean {
        return this.paused;
    }

    private async eventHandler(event: vscode.TextEditorSelectionChangeEvent) {
        if (!event || this.paused) {
            return;
        }

        const arrival = await parseArrivalFromEditorState(event.textEditor);
        if (!arrival) {
            return;
        }

        const savedArrival = this.recorder.record(arrival);

        this.arrivalHistoryProvider.refresh();
        this.decorationProvider.refresh();
        this.statusBarItem.refresh();

        if (this.treeView.visible) {
            // treeView.reveal is a way to show a selected status, do auto-focusing and auto-expanding
            // if the treeView is not visible(hidden), we should stop doing revealing, since it will expand the hidden view automatically
            this.treeView.reveal(savedArrival, { select: true, focus: false, expand: true });
        }
    }

    registerSelf() {
        return vscode.window.onDidChangeTextEditorSelection(this.eventHandler.bind(this));
    }
}


export function registerConfigChangeHandler(
    arrivalHistoryProvider: ArrivalHistoryProvider,
    arrivalDecorationProvider: ArrivalDecorationProvider,
    arrivalStatusBarItem: ArrivalStatusBarItem,
) {
    return vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('navigationHistory.showStatusBarItem')) {
            const showStatusBar = vscode.workspace.getConfiguration('navigationHistory').get('showStatusBarItem');
            if (showStatusBar) {
                arrivalStatusBarItem.enable();
            } else {
                arrivalStatusBarItem.disable();
            }

        } else if (event.affectsConfiguration('navigationHistory.item.showFilenameInItemDescription')) {
            const showFilenameInItemDescription = vscode.workspace.getConfiguration('navigationHistory.item').get('showFilenameInItemDescription');
            arrivalHistoryProvider.updateReprOptions({
                showFilename: showFilenameInItemDescription as boolean
            });

        } else if (event.affectsConfiguration('navigationHistory.item.showPositionInItemDescription')) {
            const showPositionInItemDescription = vscode.workspace.getConfiguration('navigationHistory.item').get('showPositionInItemDescription');
            arrivalHistoryProvider.updateReprOptions({
                showPosition: showPositionInItemDescription as boolean
            });

        } else if (event.affectsConfiguration('navigationHistory.delimiter.enableDelimiter')) {
            const enableDelimiter = vscode.workspace.getConfiguration('navigationHistory.delimiter').get('enableDelimiter');
            arrivalHistoryProvider.updateReprOptions({
                enableDelimiter: enableDelimiter as boolean
            });

        } else if (event.affectsConfiguration('navigationHistory.delimiter.delimiterString')) {
            const delimiterString = vscode.workspace.getConfiguration('navigationHistory.delimiter').get('delimiterString');
            arrivalHistoryProvider.updateReprOptions({
                delimiterString: delimiterString as string
            });

        } else if (event.affectsConfiguration('navigationHistory.sorting.defaultSortField')) {
            const sortField = vscode.workspace.getConfiguration('navigationHistory.sorting').get('defaultSortField');
            arrivalHistoryProvider.updateReprOptions({
                sortField: sortField as SortField
            });

        } else if (event.affectsConfiguration('navigationHistory.sorting.defaultSortOrder')) {
            const sortOrder = vscode.workspace.getConfiguration('navigationHistory.sorting').get('defaultSortOrder');
            arrivalHistoryProvider.updateReprOptions({
                sortOrder: sortOrder as SortOrder
            });

        } else if (event.affectsConfiguration('navigationHistory.history.hideHistory')) {
            const isHiding = vscode.workspace.getConfiguration('navigationHistory.history').get('hideHistory');
            arrivalHistoryProvider.updateReprOptions({
                hideHistory: isHiding as boolean
            });

        } else if (event.affectsConfiguration('navigationHistory.history.unpinnedItemHidingThreshold')) {
            const unpinHideThreshold = vscode.workspace.getConfiguration('navigationHistory.history').get('unpinnedItemHidingThreshold');
            arrivalHistoryProvider.updateReprOptions({
                unpinHideThreshold: unpinHideThreshold as number
            });

        } else if (event.affectsConfiguration('navigationHistory.color.enableColorizing')) {
            const colorize = vscode.workspace.getConfiguration('navigationHistory.color').get('enableColorizing');
            arrivalDecorationProvider.updateReprOptions({
                colorize: colorize as boolean
            });
        } else if (event.affectsConfiguration('navigationHistory.color.warmColorThreshold')) {
            const warmColorThreshold = vscode.workspace.getConfiguration('navigationHistory.color').get('warmColorThreshold');
            arrivalDecorationProvider.updateReprOptions({
                warmColorThreshold: warmColorThreshold as number
            });
        } else if (event.affectsConfiguration('navigationHistory.color.hotColorThreshold')) {
            const hotColorThreshold = vscode.workspace.getConfiguration('navigationHistory.color').get('hotColorThreshold');
            arrivalDecorationProvider.updateReprOptions({
                hotColorThreshold: hotColorThreshold as number
            });
        }
    });
}
