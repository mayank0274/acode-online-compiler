import plugin from "../plugin.json";
import tag from 'html-tag-js';
import style from './style.scss';
const qs = require("qs");

const CONSTANT = Object.freeze({
	api_url: "https://api.codex.jaagrav.in",
});

class AcodeBasicOnlineCompiler {
	constructor() {
		this.command = {
			name: "CodeX compiler",
			description: "CodeX compiler",
			exec: this.compile.bind(this),
		};
		this.config = {
			method: "post",
			url: CONSTANT.api_url,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			data: "",
		};
	}

	async init($page) {
	    $page.id = 'acode-online-compiler';
	    this.$page = $page;
	    this.$style = tag('style',{
	        textContent: style,
	    });
	    this.outputArea = tag('div',{
	        className: 'outputArea',
	    });
	    this.$page.append(this.outputArea);
		editorManager.editor.commands.addCommand(this.command);
		document.head.append(this.$style);
		this.$page.onhide = () => {
		    this.outputArea.innerHTML = '';
		}
	}

	async userInput() {
		const options = {};
		const input = await acode.prompt(
			"Input for your program (every input is separated by new line)",
			"",
			"textarea",
			options
		);
		return input && input !== null && input !== undefined
			? String(input)
			: "";
	}

	async compile() {
		const input = await this.userInput();

		const loadingDialog = acode.loader("Please wait...", "compiling");
		loadingDialog.show();

		const fileExt = editorManager.activeFile.filename
			.match(/\.[0-9a-z]+$/i)[0]
			.replace(".", "");
		const data = qs.stringify({
			code: editorManager.editor.getValue() || "",
			language: fileExt,
			input: input.replaceAll("\n", "\\n"),
		});

		const config = {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: data,
		};
		fetch(CONSTANT.api_url, config)
			.then((res) => res.json())
			.then((result) => {
				loadingDialog.destroy();
				if (result.error) {
					this.showOutput(true, result);
				} else {
					this.showOutput(false, result);
				}
			})
			.catch((err) => {
				loadingDialog.destroy();
				this.showOutput(true, {
					error: err,
				});
			});
	}

	showOutput(isError, outputObj) {
	    
		if (isError) {
		    this.$page.settitle('Online Compiler(Error)');
		    this.$page.show();
		    this.outputArea.innerHTML = outputObj.error.replaceAll("\n", "<br/>");
		} else {
		    this.$page.settitle('Online Compiler(Success)');
		    this.$page.show();
		    this.outputArea.innerHTML = outputObj.output.replaceAll("\n", "<br/>");
		}
	}
	async destroy() {
		editorManager.editor.commands.removeCommand(this.command);
	}
}

if (window.acode) {
	const acodePlugin = new AcodeBasicOnlineCompiler();
	acode.setPluginInit(
		plugin.id,
		(baseUrl, $page, { cacheFileUrl, cacheFile }) => {
			if (!baseUrl.endsWith("/")) {
				baseUrl += "/";
			}
			acodePlugin.baseUrl = baseUrl;
			acodePlugin.init($page, cacheFile, cacheFileUrl);
		}
	);
	acode.setPluginUnmount(plugin.id, () => {
		acodePlugin.destroy();
	});
}
