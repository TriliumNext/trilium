import { describe, it, expect } from "vitest";

// describe.skip("ShareSettingsOptions", () => { })


//     Test currently fails during import:

//  FAIL   app  widgets / type_widgets / options / other / share_settings.spec.ts[src / public / app / widgets / type_widgets / options / other / share_settings.spec.ts]
// TypeError: Class extends value undefined is not a constructor or null
//  ❯ widgets / right_panel_widget.ts: 20: 32
// 20 | class RightPanelWidget extends NoteContextAwareWidget {
//     21| private $bodyWrapper!: JQuery<HTMLElement>;
// 22 | $body!: JQuery<HTMLElement>;


import ShareSettingsOptions from "./share_settings.js";

type TestCase<T extends (...args: any) => any> = [
    desc: string,
    fnParams: Parameters<T>,
    expected: ReturnType<T>
];



describe("ShareSettingsOptions", () => {

    describe("#normalizeSharePathInput", () => {

        const testCases: TestCase<ShareSettingsOptions["normalizeSharePathInput"]>[] = [
            [
                "should handle multiple trailing '/' and remove them completely",
                ["/trailingtest////"],
                "/trailingtest"
            ],
            [
                "should handle multiple starting '/' and replace them by a single '/'",
                ["////startingtest"],
                "/startingtest"
            ],
            [
                "should handle multiple starting & trailing '/' and replace them by a single '/'",
                ["////startingAndTrailingTest///"],
                "/startingAndTrailingTest"
            ],
            [
                "should not remove any '/' other than at the end or start of the input",
                ["/test/with/subpath"],
                "/test/with/subpath"
            ],
            [
                "should prepend the string with a '/' if it does not start with one",
                ["testpath"],
                "/testpath"
            ],
            [
                "should not change anything, if the string is a single '/'",
                ["/"],
                "/"
            ],
        ];

        testCases.forEach((testCase) => {
            const [desc, fnParams, expected] = testCase;
            return it(desc, () => {
                const shareSettings = new ShareSettingsOptions();
                const actual = shareSettings.normalizeSharePathInput(...fnParams);
                expect(actual).toStrictEqual(expected);
            });
        });


    })

})