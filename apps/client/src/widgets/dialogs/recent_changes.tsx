import { useEffect, useState } from "preact/hooks";
import appContext, { EventData } from "../../components/app_context";
import dialog, { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import server from "../../services/server";
import toast from "../../services/toast";
import Button from "../react/Button";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import hoisted_note from "../../services/hoisted_note";
import type { RecentChangesRow } from "@triliumnext/commons";
import froca from "../../services/froca";
import { formatDateTime } from "../../utils/formatters";
import link from "../../services/link";
import RawHtml from "../react/RawHtml";
import ws from "../../services/ws";

interface RecentChangesDialogProps {
    ancestorNoteId?: string;
}

function RecentChangesDialogComponent({ ancestorNoteId }: RecentChangesDialogProps) {
    const [ groupedByDate, setGroupedByDate ] = useState<Map<String, RecentChangesRow[]>>();
    const [ needsRefresh, setNeedsRefresh ] = useState<boolean>(false);

    if (!groupedByDate || needsRefresh) {
        useEffect(() => {
            if (needsRefresh) {
                setNeedsRefresh(false);   
            }

            server.get<RecentChangesRow[]>(`recent-changes/${ancestorNoteId}`)
                .then(async (recentChanges) => {
                    // preload all notes into cache
                    await froca.getNotes(
                        recentChanges.map((r) => r.noteId),
                        true
                    );

                    const groupedByDate = groupByDate(recentChanges);
                    setGroupedByDate(groupedByDate);
                });
        })
    }

    return (ancestorNoteId &&
        <Modal
            title={t("recent_changes.title")}
            className="recent-changes-dialog"
            size="lg"
            scrollable
            header={
                <Button
                    text={t("recent_changes.erase_notes_button")}
                    small style={{ padding: "0 10px" }}
                    onClick={() => {
                        server.post("notes/erase-deleted-notes-now").then(() => {
                            setNeedsRefresh(true);
                            toast.showMessage(t("recent_changes.deleted_notes_message"));
                        });
                    }}
                />
            }
        >
            <div className="recent-changes-content">
                {groupedByDate?.size
                    ? <RecentChangesTimeline groupedByDate={groupedByDate} />
                    : <>{t("recent_changes.no_changes_message")}</>}
            </div>
        </Modal>
    )
}

function RecentChangesTimeline({ groupedByDate }: { groupedByDate: Map<String, RecentChangesRow[]> }) {
    return (
        <>
            { Array.from(groupedByDate.entries()).map(([dateDay, dayChanges]) => {
                const formattedDate = formatDateTime(dateDay as string, "full", "none");

                return (
                    <div>
                        <b>{formattedDate}</b>

                        <ul>
                            { dayChanges.map((change) => {
                                const isDeleted = change.current_isDeleted;
                                const formattedTime = formatDateTime(change.date, "none", "short");
                                const note = froca.getNoteFromCache(change.noteId);
                                const notePath = note?.getBestNotePathString();

                                return (
                                    <li className={isDeleted ? "deleted-note" : ""}>
                                        <span title={change.date}>{formattedTime}</span>
                                        { !isDeleted
                                        ? <NoteLink notePath={notePath} title={change.current_title} />
                                        : <DeletedNoteLink change={change} /> }
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </>
    );
}

function NoteLink({ notePath, title }: { notePath: string, title: string }) {
    if (!notePath || !title) {
        return null;
    }

    const [ noteLink, setNoteLink ] = useState<JQuery<HTMLElement> | null>(null);
    useEffect(() => {
        link.createLink(notePath, {
            title,
            showNotePath: true
        }).then(setNoteLink);
    }, [notePath, title]);
    return (
        noteLink ? <RawHtml className="note-title" html={noteLink[0].innerHTML} /> : <span className="note-title">{title}</span>
    );
}

function DeletedNoteLink({ change }: { change: RecentChangesRow }) {
    return (
        <>
            <span className="note-title">{change.current_title}</span>
            &nbsp;
            (<a href="javascript:"
                onClick={() => {
                    async () => {
                        const text = t("recent_changes.confirm_undelete");

                        if (await dialog.confirm(text)) {
                            await server.put(`notes/${change.noteId}/undelete`);
                            closeActiveDialog();
                            await ws.waitForMaxKnownEntityChangeId();

                            const activeContext = appContext.tabManager.getActiveContext();
                            if (activeContext) {
                                activeContext.setNote(change.noteId);
                            }
                        }
                    }
                }}>
                {t("recent_changes.undelete_link")})
            </a>
        </>
    );
}

export default class RecentChangesDialog extends ReactBasicWidget {

    private props: RecentChangesDialogProps = {};

    get component() {
        return <RecentChangesDialogComponent {...this.props} />
    }

    async showRecentChangesEvent({ ancestorNoteId }: EventData<"showRecentChanges">) {
        this.props = {
            ancestorNoteId: ancestorNoteId ?? hoisted_note.getHoistedNoteId()
        };
        this.doRender();
        openDialog(this.$widget);
    }

}

function groupByDate(rows: RecentChangesRow[]) {
    const groupedByDate = new Map<String, RecentChangesRow[]>();

    for (const row of rows) {
        const dateDay = row.date.substr(0, 10);

        if (!groupedByDate.has(dateDay)) {
            groupedByDate.set(dateDay, []);
        }

        groupedByDate.get(dateDay)!.push(row);
    }

    return groupedByDate;
}
