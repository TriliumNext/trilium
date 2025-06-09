import type BNote from "../becca/entities/bnote.js";
import type { Dayjs } from "dayjs";

import advancedFormat from "dayjs/plugin/advancedFormat.js";
import attributeService from "./attributes.js";
import cloningService from "./cloning.js";
import dayjs from "dayjs";
import hoistedNoteService from "./hoisted_note.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import noteService from "./notes.js";
import optionService from "./options.js";
import protectedSessionService from "./protected_session.js";
import quarterOfYear from "dayjs/plugin/quarterOfYear.js";
import searchContext from "../services/search/search_context.js";
import searchService from "../services/search/services/search.js";
import sql from "./sql.js";
import { t } from "i18next";
import { ordinal } from "./i18n.js";

dayjs.extend(isSameOrAfter);
dayjs.extend(quarterOfYear);
dayjs.extend(advancedFormat);

const CALENDAR_ROOT_LABEL = "calendarRoot";
const YEAR_LABEL = "yearNote";
const QUARTER_LABEL = "quarterNote";
const MONTH_LABEL = "monthNote";
const WEEK_LABEL = "weekNote";
const DATE_LABEL = "dateNote";

const WEEKDAY_TRANSLATION_IDS = [
    "weekdays.sunday", "weekdays.monday", "weekdays.tuesday",
    "weekdays.wednesday", "weekdays.thursday", "weekdays.friday",
    "weekdays.saturday", "weekdays.sunday"
];

const MONTH_TRANSLATION_IDS = [
    "months.january",
    "months.february",
    "months.march",
    "months.april",
    "months.may",
    "months.june",
    "months.july",
    "months.august",
    "months.september",
    "months.october",
    "months.november",
    "months.december"
];

type TimeUnit = "year" | "quarter" | "month" | "week" | "day";

const baseReplacements = {
    year: [ "year" ],
    quarter: [ "quarterNumber", "shortQuarter" ],
    month: [ "isoMonth", "monthNumber", "monthNumberPadded",
        "month", "shortMonth3", "shortMonth4" ],
    week: [ "weekNumber", "weekNumberPadded", "shortWeek", "shortWeek3" ],
    day: [ "isoDate", "dateNumber", "dateNumberPadded",
        "ordinal", "weekDay", "weekDay3", "weekDay2" ]
};

function getTimeUnitReplacements(timeUnit: TimeUnit): string[] {
    const units: TimeUnit[] = [ "year", "quarter", "month", "week", "day" ];
    const index = units.indexOf(timeUnit);
    return units.slice(0, index + 1).flatMap(unit => baseReplacements[unit]);
}

function getJournalNoteTitle(
    rootNote: BNote,
    timeUnit: TimeUnit,
    dateObj: Dayjs,
    number: number
) {
    const patterns = {
        year: rootNote.getOwnedLabelValue("yearPattern") || "{year}",
        quarter: rootNote.getOwnedLabelValue("quarterPattern") || t("quarterNumber"),
        month: rootNote.getOwnedLabelValue("monthPattern") || "{monthNumberPadded} - {month}",
        week: rootNote.getOwnedLabelValue("weekPattern") || t("weekdayNumber"),
        day: rootNote.getOwnedLabelValue("datePattern") || "{dateNumberPadded} - {weekDay}"
    };

    const pattern = patterns[timeUnit];
    const monthName = t(MONTH_TRANSLATION_IDS[dateObj.month()]);
    const weekDay = t(WEEKDAY_TRANSLATION_IDS[dateObj.day()]);
    const numberStr = number.toString();
    const ordinalStr = ordinal(dateObj);

    const allReplacements: Record<string, string> = {
        // Common date formats
        "{year}": dateObj.format("YYYY"),

        // Month related
        "{isoMonth}": dateObj.format("YYYY-MM"),
        "{monthNumber}": numberStr,
        "{monthNumberPadded}": numberStr.padStart(2, "0"),
        "{month}": monthName,
        "{shortMonth3}": monthName.slice(0, 3),
        "{shortMonth4}": monthName.slice(0, 4),

        // Quarter related
        "{quarterNumber}": numberStr,
        "{shortQuarter}": `Q${numberStr}`,

        // Week related
        "{weekNumber}": numberStr,
        "{weekNumberPadded}": numberStr.padStart(2, "0"),
        "{shortWeek}": `W${numberStr}`,
        "{shortWeek3}": `W${numberStr.padStart(2, "0")}`,

        // Day related
        "{isoDate}": dateObj.format("YYYY-MM-DD"),
        "{dateNumber}": numberStr,
        "{dateNumberPadded}": numberStr.padStart(2, "0"),
        "{ordinal}": ordinalStr,
        "{weekDay}": weekDay,
        "{weekDay3}": weekDay.substring(0, 3),
        "{weekDay2}": weekDay.substring(0, 2)
    };

    const allowedReplacements = Object.entries(allReplacements).reduce((acc, [ key, value ]) => {
        const replacementKey = key.slice(1, -1);
        if (getTimeUnitReplacements(timeUnit).includes(replacementKey)) {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, string>);

    return Object.entries(allowedReplacements).reduce(
        (title, [ key, value ]) => title.replace(new RegExp(key, "g"), value),
        pattern
    );
}

function createNote(parentNote: BNote, noteTitle: string) {
    return noteService.createNewNote({
        parentNoteId: parentNote.noteId,
        title: noteTitle,
        content: "",
        isProtected: parentNote.isProtected &&
         protectedSessionService.isProtectedSessionAvailable(),
        type: "text"
    }).note;
}

function getRootCalendarNote(): BNote {
    let rootNote;

    const workspaceNote = hoistedNoteService.getWorkspaceNote();

    if (!workspaceNote || !workspaceNote.isRoot()) {
        rootNote = searchService.findFirstNoteWithQuery(
            "#workspaceCalendarRoot", new searchContext({ ignoreHoistedNote: false })
        );
    }

    if (!rootNote) {
        rootNote = attributeService.getNoteWithLabel(CALENDAR_ROOT_LABEL);
    }

    if (!rootNote) {
        sql.transactional(() => {
            rootNote = noteService.createNewNote({
                parentNoteId: "root",
                title: "Calendar",
                target: "into",
                isProtected: false,
                type: "text",
                content: ""
            }).note;

            attributeService.createLabel(rootNote.noteId, CALENDAR_ROOT_LABEL);
            attributeService.createLabel(rootNote.noteId, "sorted");
        });
    }

    return rootNote as BNote;
}

function getYearNote(dateStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    const yearStr = dateStr.trim().substring(0, 4);

    let yearNote = searchService.findFirstNoteWithQuery(
        `#${YEAR_LABEL}="${yearStr}"`, new searchContext({ ancestorNoteId: rootNote.noteId })
    );

    if (yearNote) {
        return yearNote;
    }

    sql.transactional(() => {
        yearNote = createNote(rootNote, yearStr);

        attributeService.createLabel(yearNote.noteId, YEAR_LABEL, yearStr);
        attributeService.createLabel(yearNote.noteId, "sorted");

        const yearTemplateAttr = rootNote.getOwnedAttribute("relation", "yearTemplate");

        if (yearTemplateAttr) {
            attributeService.createRelation(yearNote.noteId, "template", yearTemplateAttr.value);
        }
    });

    return yearNote as unknown as BNote;
}

function getQuarterNumberStr(date: Dayjs) {
    return `${date.year()}-Q${date.quarter()}`;
}

function getQuarterNote(quarterStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    quarterStr = quarterStr.trim().substring(0, 7);

    let quarterNote = searchService.findFirstNoteWithQuery(
        `#${QUARTER_LABEL}="${quarterStr}"`, new searchContext({ ancestorNoteId: rootNote.noteId })
    );

    if (quarterNote) {
        return quarterNote;
    }

    const [ yearStr, quarterNumberStr ] = quarterStr.trim().split("-Q");
    const quarterNumber = parseInt(quarterNumberStr);
    const firstMonth = (quarterNumber - 1) * 3;
    const quarterStartDate = dayjs().year(parseInt(yearStr)).month(firstMonth).date(1);

    const yearNote = getYearNote(yearStr, rootNote);
    const noteTitle = getJournalNoteTitle(
        rootNote, "quarter", quarterStartDate, quarterNumber
    );

    sql.transactional(() => {
        quarterNote = createNote(yearNote, noteTitle);

        attributeService.createLabel(quarterNote.noteId, QUARTER_LABEL, quarterStr);
        attributeService.createLabel(quarterNote.noteId, "sorted");

        const quarterTemplateAttr = rootNote.getOwnedAttribute("relation", "quarterTemplate");

        if (quarterTemplateAttr) {
            attributeService.createRelation(
                quarterNote.noteId, "template", quarterTemplateAttr.value
            );
        }
    });

    return quarterNote as unknown as BNote;
}

function getMonthNote(dateStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    const monthStr = dateStr.substring(0, 7);
    const monthNumber = dateStr.substring(5, 7);

    let monthNote = searchService.findFirstNoteWithQuery(
        `#${MONTH_LABEL}="${monthStr}"`, new searchContext({ ancestorNoteId: rootNote.noteId })
    );

    if (monthNote) {
        return monthNote;
    }

    let monthParentNote: BNote | null;

    if (rootNote.hasLabel("enableQuarterNote")) {
        monthParentNote = getQuarterNote(getQuarterNumberStr(dayjs(dateStr)), rootNote);
    } else {
        monthParentNote = getYearNote(dateStr, rootNote);
    }

    const noteTitle = getJournalNoteTitle(
        rootNote, "month", dayjs(dateStr), parseInt(monthNumber)
    );

    sql.transactional(() => {
        monthNote = createNote(monthParentNote, noteTitle);

        attributeService.createLabel(monthNote.noteId, MONTH_LABEL, monthStr);
        attributeService.createLabel(monthNote.noteId, "sorted");

        const monthTemplateAttr = rootNote.getOwnedAttribute("relation", "monthTemplate");

        if (monthTemplateAttr) {
            attributeService.createRelation(monthNote.noteId, "template", monthTemplateAttr.value);
        }
    });

    return monthNote as unknown as BNote;
}

function getWeekStartDate(date: Dayjs): Dayjs {
    const day = date.day();
    let diff: number;

    if (optionService.getOption("firstDayOfWeek") === "0") { // Sunday
        diff = date.date() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    } else { // Monday
        diff = date.date() - day;
    }

    const startDate = date.clone().date(diff);
    return startDate;
}

// TODO: Duplicated with getWeekNumber in src/public/app/widgets/buttons/calendar.ts
// Maybe can be merged later in monorepo setup
function getWeekNumberStr(date: Dayjs): string {
    const year = date.year();
    const dayOfWeek = (day: number) =>
        (day - parseInt(optionService.getOption("firstDayOfWeek")) + 7) % 7;

    // Get first day of the year and adjust to first week start
    const jan1 = date.clone().year(year).month(0).date(1);
    const jan1Weekday = jan1.day();
    const dayOffset = dayOfWeek(jan1Weekday);
    let firstWeekStart = jan1.clone().subtract(dayOffset, "day");

    // Adjust based on week rule
    switch (parseInt(optionService.getOption("firstWeekOfYear"))) {
        case 1: { // ISO 8601: first week contains Thursday
            const thursday = firstWeekStart.clone().add(3, "day"); // Monday + 3 = Thursday
            if (thursday.year() < year) {
                firstWeekStart = firstWeekStart.add(7, "day");
            }
            break;
        }
        case 2: { // minDaysInFirstWeek rule
            const daysInFirstWeek = 7 - dayOffset;
            if (daysInFirstWeek < parseInt(optionService.getOption("minDaysInFirstWeek"))) {
                firstWeekStart = firstWeekStart.add(7, "day");
            }
            break;
        }
        // default case 0: week containing Jan 1 → already handled
    }

    const diffDays = date.startOf("day").diff(firstWeekStart.startOf("day"), "day");
    const weekNumber = Math.floor(diffDays / 7) + 1;

    // Handle case when date is before first week start → belongs to last week of previous year
    if (weekNumber <= 0) {
        return getWeekNumberStr(date.subtract(1, "day"));
    }

    // Handle case when date belongs to first week of next year
    const nextYear = year + 1;
    const jan1Next = date.clone().year(nextYear).month(0).date(1);
    const jan1WeekdayNext = jan1Next.day();
    const offsetNext = dayOfWeek(jan1WeekdayNext);
    let nextYearWeekStart = jan1Next.clone().subtract(offsetNext, "day");

    switch (parseInt(optionService.getOption("firstWeekOfYear"))) {
        case 1: {
            const thursday = nextYearWeekStart.clone().add(3, "day");
            if (thursday.year() < nextYear) {
                nextYearWeekStart = nextYearWeekStart.add(7, "day");
            }
            break;
        }
        case 2: {
            const daysInFirstWeek = 7 - offsetNext;
            if (daysInFirstWeek < parseInt(optionService.getOption("minDaysInFirstWeek"))) {
                nextYearWeekStart = nextYearWeekStart.add(7, "day");
            }
            break;
        }
    }

    if (date.isSameOrAfter(nextYearWeekStart)) {
        return `${nextYear}-W01`;
    }

    return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
}

function getWeekFirstDayNote(dateStr: string, rootNote: BNote | null = null) {
    const weekStartDate = getWeekStartDate(dayjs(dateStr));
    return getDayNote(weekStartDate.format("YYYY-MM-DD"), rootNote);
}

/**
 * Returns the {@link BNote} corresponding to the given week. If there is no note associated yet to that week, it will be created and returned instead.
 *
 * @param weekStr the week for which to return the corresponding note, in the format `2024-W04`.
 * @param _rootNote a {@link BNote} representing the calendar root, or {@code null} or not specified to use the default root calendar note.
 * @returns a Promise that resolves to the {@link BNote} corresponding to the week note.
 */
function getWeekNote(weekStr: string, _rootNote: BNote | null = null): BNote | null {
    const rootNote = _rootNote || getRootCalendarNote();
    if (!rootNote.hasLabel("enableWeekNote")) {
        return null;
    }

    weekStr = weekStr.trim().substring(0, 8);

    let weekNote = searchService.findFirstNoteWithQuery(
        `#${WEEK_LABEL}="${weekStr}"`, new searchContext({ ancestorNoteId: rootNote.noteId })
    );

    if (weekNote) {
        return weekNote;
    }

    const [ yearStr, weekNumStr ] = weekStr.trim().split("-W");
    const weekNumber = parseInt(weekNumStr);

    const firstDayOfYear = dayjs().year(parseInt(yearStr)).month(0).date(1);
    const weekStartDate = firstDayOfYear.add(weekNumber - 1, "week");
    const startDate = getWeekStartDate(weekStartDate);
    const endDate = dayjs(startDate).add(6, "day");

    const startMonth = startDate.month();
    const endMonth = endDate.month();

    const monthNote = getMonthNote(startDate.format("YYYY-MM-DD"), rootNote);
    const noteTitle = getJournalNoteTitle(rootNote, "week", startDate, weekNumber);

    sql.transactional(() => {
        weekNote = createNote(monthNote, noteTitle);

        attributeService.createLabel(weekNote.noteId, WEEK_LABEL, weekStr);
        attributeService.createLabel(weekNote.noteId, "sorted");

        const weekTemplateAttr = rootNote.getOwnedAttribute("relation", "weekTemplate");

        if (weekTemplateAttr) {
            attributeService.createRelation(weekNote.noteId, "template", weekTemplateAttr.value);
        }

        // If the week spans different months, clone the week note in the other month as well
        if (startMonth !== endMonth) {
            const secondMonthNote = getMonthNote(endDate.format("YYYY-MM-DD"), rootNote);
            cloningService.cloneNoteToParentNote(weekNote.noteId, secondMonthNote.noteId);
        }
    });

    return weekNote as unknown as BNote;
}

function getDayNote(dateStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    dateStr = dateStr.trim().substring(0, 10);

    let dateNote = searchService.findFirstNoteWithQuery(
        `#${DATE_LABEL}="${dateStr}"`, new searchContext({ ancestorNoteId: rootNote.noteId })
    );

    if (dateNote) {
        return dateNote;
    }

    let dateParentNote: BNote | null;

    if (rootNote.hasLabel("enableWeekNote")) {
        dateParentNote = getWeekNote(getWeekNumberStr(dayjs(dateStr)), rootNote);
    } else {
        dateParentNote = getMonthNote(dateStr, rootNote);
    }

    const dayNumber = dateStr.substring(8, 10);
    const noteTitle = getJournalNoteTitle(
        rootNote, "day", dayjs(dateStr), parseInt(dayNumber)
    );

    sql.transactional(() => {
        dateNote = createNote(dateParentNote as BNote, noteTitle);

        attributeService.createLabel(dateNote.noteId, DATE_LABEL, dateStr.substring(0, 10));

        const dateTemplateAttr = rootNote.getOwnedAttribute("relation", "dateTemplate");

        if (dateTemplateAttr) {
            attributeService.createRelation(dateNote.noteId, "template", dateTemplateAttr.value);
        }
    });

    return dateNote as unknown as BNote;
}

function getTodayNote(rootNote: BNote | null = null) {
    return getDayNote(dayjs().format("YYYY-MM-DD"), rootNote);
}

export default {
    getRootCalendarNote,
    getYearNote,
    getQuarterNote,
    getMonthNote,
    getWeekNote,
    getWeekFirstDayNote,
    getDayNote,
    getTodayNote,
    getJournalNoteTitle
};
