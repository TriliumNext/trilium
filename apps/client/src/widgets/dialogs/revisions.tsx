import type { RevisionPojo, RevisionItem } from "@triliumnext/commons";
import appContext, { EventData } from "../../components/app_context";
import FNote from "../../entities/fnote";
import dialog, { closeActiveDialog, openDialog } from "../../services/dialog";
import froca from "../../services/froca";
import { t } from "../../services/i18n";
import server from "../../services/server";
import toast from "../../services/toast";
import Button from "../react/Button";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import FormList, { FormListItem } from "../react/FormList";
import utils from "../../services/utils";
import { useEffect, useRef, useState } from "preact/hooks";
import protected_session_holder from "../../services/protected_session_holder";
import { renderMathInElement } from "../../services/math";
import { CSSProperties } from "preact/compat";
import open from "../../services/open";
import ActionButton from "../react/ActionButton";
import options from "../../services/options";

interface RevisionsDialogProps {
    note?: FNote;
}

function RevisionsDialogComponent({ note }: RevisionsDialogProps) {
    const [ revisions, setRevisions ] = useState<RevisionItem[]>([]);
    const [ currentRevision, setCurrentRevision ] = useState<RevisionItem>();

    if (note) {
        useEffect(() => {
            server.get<RevisionItem[]>(`notes/${note.noteId}/revisions`).then(setRevisions);
        }, [ note.noteId ]);
    }

    if (revisions?.length && !currentRevision) {
        setCurrentRevision(revisions[0]);
    }

    return (note &&
        <Modal
            className="revisions-dialog"
            size="xl"
            title={t("revisions.note_revisions")}
            helpPageId="vZWERwf8U3nx"
            bodyStyle={{ display: "flex", height: "80vh" }}
            header={
                (!!revisions?.length && <Button text={t("revisions.delete_all_revisions")} small style={{ padding: "0 10px" }}
                    onClick={async () => {
                        const text = t("revisions.confirm_delete_all");

                        if (await dialog.confirm(text)) {
                            await server.remove(`notes/${note.noteId}/revisions`);

                            closeActiveDialog();
                            toast.showMessage(t("revisions.revisions_deleted"));
                        }
                    }}/>)
            }
            footer={<RevisionFooter note={note} />} 
            footerStyle={{ paddingTop: 0, paddingBottom: 0 }}
            >
                <RevisionsList
                    revisions={revisions}
                    onSelect={(revisionId) => {
                        const correspondingRevision = revisions.find((r) => r.revisionId === revisionId);
                        if (correspondingRevision) {
                            setCurrentRevision(correspondingRevision);
                        }
                    }}
                />

                <div className="revision-content-wrapper" style={{
                    flexGrow: "1",
                    marginLeft: "20px",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0                    
                }}>
                    <RevisionPreview revisionItem={currentRevision} />
                </div>
        </Modal>
    )
}

function RevisionsList({ revisions, onSelect }: { revisions: RevisionItem[], onSelect: (val: string) => void }) {
    return (
        <FormList style={{ height: "100%", flexShrink: 0 }} onSelect={onSelect}>
            {revisions.map((item) => 
                <FormListItem
                    title={t("revisions.revision_last_edited", { date: item.dateLastEdited })}
                    value={item.revisionId}
                >
                    {item.dateLastEdited && item.dateLastEdited.substr(0, 16)} ({item.contentLength && utils.formatSize(item.contentLength)})
                </FormListItem>
            )}
        </FormList>);
}

function RevisionPreview({ revisionItem }: { revisionItem?: RevisionItem}) {
    const [ fullRevision, setFullRevision ] = useState<RevisionPojo>();
    const [ needsRefresh, setNeedsRefresh ] = useState<boolean>();

    useEffect(() => {
        setNeedsRefresh(false);
        if (revisionItem) {
            server.get<RevisionPojo>(`revisions/${revisionItem.revisionId}`).then(setFullRevision);
        } else {
            setFullRevision(undefined);            
        }
    }, [revisionItem, needsRefresh]);

    return (
        <>
            <div style="flex-grow: 0; display: flex; justify-content: space-between;">
                <h3 className="revision-title" style="margin: 3px; flex-grow: 100;">{revisionItem?.title ?? t("revisions.no_revisions")}</h3>
                {(revisionItem && <div className="revision-title-buttons">
                    {(!revisionItem.isProtected || protected_session_holder.isProtectedSessionAvailable()) &&
                        <>
                            <Button
                                icon="bx bx-history"
                                text={t("revisions.restore_button")}
                                onClick={async () => {
                                    if (await dialog.confirm(t("revisions.confirm_restore"))) {
                                        await server.post(`revisions/${revisionItem.revisionId}/restore`);
                                        closeActiveDialog();
                                        toast.showMessage(t("revisions.revision_restored"));
                                    }
                                }}/>
                            &nbsp;
                            <Button
                                icon="bx bx-trash"
                                text={t("revisions.delete_button")}
                                onClick={async () => {
                                    if (await dialog.confirm(t("revisions.confirm_delete"))) {
                                        await server.remove(`revisions/${revisionItem.revisionId}`);
                                        setNeedsRefresh(true);
                                        toast.showMessage(t("revisions.revision_deleted"));
                                    }
                                }} />
                            &nbsp;
                            <Button
                                primary
                                icon="bx bx-download"
                                text={t("revisions.download_button")}
                                onClick={() => {
                                    if (revisionItem.revisionId) {
                                        open.downloadRevision(revisionItem.noteId, revisionItem.revisionId)}
                                    }
                                }/>
                        </>
                    }
                </div>)}
            </div>
            <div className="revision-content use-tn-links" style={{ overflow: "auto", wordBreak: "break-word" }}>
                <RevisionContent revisionItem={revisionItem} fullRevision={fullRevision} />
            </div>
        </>
    );
}

const IMAGE_STYLE: CSSProperties = {
    maxWidth: "100%",
    maxHeight: "90%",
    objectFit: "contain"
};

const CODE_STYLE: CSSProperties = {
    maxWidth: "100%",
    wordBreak: "break-all",
    whiteSpace: "pre-wrap"
};

function RevisionContent({ revisionItem, fullRevision }: { revisionItem?: RevisionItem, fullRevision?: RevisionPojo }) {
    const content = fullRevision?.content;
    if (!revisionItem || !content) {
        return <></>;
    }


    switch (revisionItem.type) {
        case "text": {
            const contentRef = useRef<HTMLDivElement>(null);
            useEffect(() => {
                if (contentRef.current?.querySelector("span.math-tex")) {
                    renderMathInElement(contentRef.current, { trust: true });
                }
            });
            return <div ref={contentRef} className="ck-content" dangerouslySetInnerHTML={{ __html: content as string }}></div>
        }
        case "code":
            return <pre style={CODE_STYLE}>{content}</pre>;
        case "image":            
            switch (revisionItem.mime) {
                case "image/svg+xml": {
                    //Base64 of other format images may be embedded in svg
                    const encodedSVG = encodeURIComponent(content as string); 
                    return <img
                        src={`data:${fullRevision.mime};utf8,${encodedSVG}`}
                        style={IMAGE_STYLE} />;
                }
                default: {
                    // the reason why we put this inline as base64 is that we do not want to let user copy this
                    // as a URL to be used in a note. Instead, if they copy and paste it into a note, it will be uploaded as a new note
                    return <img
                        src={`data:${fullRevision.mime};base64,${fullRevision.content}`}
                        style={IMAGE_STYLE} />
                }
            }
        case "file":
            return <table cellPadding="10">
                <tr>
                    <th>{t("revisions.mime")}</th>
                    <td>{revisionItem.mime}</td>
                </tr>
                <tr>
                    <th>{t("revisions.file_size")}</th>
                    <td>{revisionItem.contentLength && utils.formatSize(revisionItem.contentLength)}</td>
                </tr>
                {fullRevision.content &&
                    <tr>
                        <td colspan={2}>
                            <strong>{t("revisions.preview")}</strong>
                            <pre className="file-preview-content" style={CODE_STYLE}>{fullRevision.content}</pre>
                        </td>
                    </tr>
                }
            </table>;
        case "canvas":
        case "mindMap":
        case "mermaid": {
            const encodedTitle = encodeURIComponent(revisionItem.title);
            return <img
                src={`api/revisions/${revisionItem.revisionId}/image/${encodedTitle}?${Math.random()}`}
                style={IMAGE_STYLE} />;
        }
        default:
            return <>{t("revisions.preview_not_available")}</>
    }
}

function RevisionFooter({ note }: { note: FNote }) {
    if (!note) {
        return <></>;
    }

    let revisionsNumberLimit: number | string = parseInt(note?.getLabelValue("versioningLimit") ?? "");
    if (!Number.isInteger(revisionsNumberLimit)) {
        revisionsNumberLimit = options.getInt("revisionSnapshotNumberLimit") ?? 0;
    }
    if (revisionsNumberLimit === -1) {
        revisionsNumberLimit = "∞";
    }
    
    return <>
        <span class="revisions-snapshot-interval flex-grow-1 my-0 py-0">
            {t("revisions.snapshot_interval", { seconds: options.getInt("revisionSnapshotTimeInterval") })}
        </span>
        <span class="maximum-revisions-for-current-note flex-grow-1 my-0 py-0">
            {t("revisions.maximum_revisions", { number: revisionsNumberLimit })}
        </span>
        <ActionButton
            icon="bx bx-cog" text={t("revisions.settings")}
            onClick={() => appContext.tabManager.openContextWithNote("_optionsOther", { activate: true })}
        />
    </>;
}

export default class RevisionsDialog extends ReactBasicWidget  {

    private props: RevisionsDialogProps = {};

    get component() {
        return <RevisionsDialogComponent {...this.props} />
    }

    async showRevisionsEvent({ noteId }: EventData<"showRevisions">) {
        this.props = {
            note: await getNote(noteId) ?? undefined
        };
        this.doRender();
        openDialog(this.$widget);
    }

}

async function getNote(noteId?: string | null) {
    if (noteId) {
        return await froca.getNote(noteId);
    } else {
        return appContext.tabManager.getActiveContextNote();
    }
}