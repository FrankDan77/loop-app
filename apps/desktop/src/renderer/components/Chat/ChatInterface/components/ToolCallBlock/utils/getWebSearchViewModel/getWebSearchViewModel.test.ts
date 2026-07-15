import { describe, expect, it } from "bun:test";
import { getWebSearchViewModel } from "./getWebSearchViewModel";

describe("getWebSearchViewModel", () => {
	it("maps structured results array", () => {
		const viewModel = getWebSearchViewModel({
			args: { query: "superset" },
			result: {
				results: [
					{
						title: "Loop - Run 10+ parallel coding agents on your machine",
						url: "https://superset.sh/",
						content: "snippet",
					},
				],
			},
		});

		expect(viewModel.query).toBe("superset");
		expect(viewModel.results).toEqual([
			{
				title: "Loop - Run 10+ parallel coding agents on your machine",
				url: "https://superset.sh/",
			},
		]);
	});

	it("parses transcript-style text with headings and urls", () => {
		const viewModel = getWebSearchViewModel({
			args: { query: "superset.sh terminal for coding agents" },
			result: {
				text: `Answer: summary

## superset/README.md at main - GitHub
https://github.com/FrankDan77/loop/blob/main/README.md
Description text

## Loop - Run 10+ parallel coding agents on your machine
https://superset.sh/`,
			},
		});

		expect(viewModel.results).toEqual([
			{
				title: "superset/README.md at main - GitHub",
				url: "https://github.com/FrankDan77/loop/blob/main/README.md",
			},
			{
				title: "Loop - Run 10+ parallel coding agents on your machine",
				url: "https://superset.sh/",
			},
		]);
	});

	it("reads nested text payloads and deduplicates urls", () => {
		const viewModel = getWebSearchViewModel({
			args: { query: "superset" },
			result: {
				result: {
					output: {
						text: `## Loop
https://superset.sh/
https://superset.sh/`,
					},
				},
			},
		});

		expect(viewModel.results).toEqual([
			{
				title: "Loop",
				url: "https://superset.sh/",
			},
		]);
	});
});
