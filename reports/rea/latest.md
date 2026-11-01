# Brightdesk REA Bench report

- **Target:** `/mnt/data/brightdesk-master-export`
- **Generated:** 2026-11-01T06:54:02.294Z
- **Result:** no-static-findings
- **Files inventoried:** 94
- **Total bytes:** 1138162

## Scope and limitations

Static source inspection only. No target execution, runtime tracing, binary decompilation, network probing, or proprietary-code extraction.

## App catalogue

- Brightdesk Pages (`pages`) — available
- Brightdesk Sheets (`sheets`) — available
- Brightdesk Decks (`slides`) — available
- Brightdesk Notes (`notes`) — available
- Brightdesk Database (`database`) — planned
- Brightdesk Forms (`forms`) — planned
- Brightdesk Lists (`lists`) — planned
- Brightdesk Planner (`planner`) — planned
- Brightdesk To Do (`todo`) — planned
- Brightdesk Workspace (`loop`) — planned

## Findings

No static findings. This is not a runtime or security certification.

## Inventory by file type

- (none): 6
- .css: 1
- .html: 2
- .js: 36
- .json: 7
- .md: 26
- .ps1: 2
- .sh: 5
- .txt: 6
- .yml: 3

## Evidence inventory

- `.devcontainer/devcontainer.json` — 377 bytes — SHA-256 `130ce507662082c12d525b2ca53588d8926f0c0a6f38ad99099cc526d8a54002`
- `.devcontainer/Dockerfile` — 639 bytes — SHA-256 `a086fd675a8c8e04db56946111d159c38e9c0f87d26d9ee7150ea95d09f39f77`
- `.github/dependabot.yml` — 261 bytes — SHA-256 `fe156952d1952825377de8e48c90563a3ac19bb95a6e0ced8a2f498a0f20fdf6`
- `.github/workflows/build-release.yml` — 7943 bytes — SHA-256 `9b34a41866a62b5e999406dc58f4fe34246a00f32176f2bb681c8b924d898f85`
- `.github/workflows/security-audit.yml` — 644 bytes — SHA-256 `bfe16fa51de1f08c09e56272a409e5429d2098a33f1c713d4e3d45020cfda5dd`
- `.gitignore` — 61 bytes — SHA-256 `06e0ed46d5f967c9138433ff506337e32057e6d8bd0f0c91ca64bef89eaffbe3`
- `.node-version` — 8 bytes — SHA-256 `9185b9f67843cabfa8054f65ce47ce0b52036b0bfe07ae5a6b834d97cc127140`
- `.npmrc` — 42 bytes — SHA-256 `280f9216da91ef0ae6d4b783762cc5f2b6bf041323bcf3f6f3972c9ffd462dcc`
- `.nvmrc` — 8 bytes — SHA-256 `9185b9f67843cabfa8054f65ce47ce0b52036b0bfe07ae5a6b834d97cc127140`
- `AGENTS.md` — 12805 bytes — SHA-256 `959eced9e64ce5e94c1452f2bb4c08bf8723befb5c72b1e8fe085e87932090d3`
- `APP_IMPLEMENTATION_MATRIX.md` — 2432 bytes — SHA-256 `0f56a766f3c7b6f60868bb2f6c11685af201a4f408c48de888cfe23b44193619`
- `ARCHITECTURE.md` — 4364 bytes — SHA-256 `fc1c405fe0adbc651586f4901c893dc1e815f096cbc71167ef04ac0882f041e1`
- `BRIGHTDESK_REA_BENCH.md` — 2494 bytes — SHA-256 `a1b82dcd4e0a45a40805d5cf5462ed9ac9b118c861a9d9a206e499420b2975cf`
- `BUILD_STATUS.md` — 18930 bytes — SHA-256 `178d2e240fa1aafea6733cc0971c4d627081c0699fd1d24292dd35d3b64f693d`
- `CHANGELOG.md` — 19822 bytes — SHA-256 `455e12aa6185a650270a41bbf91caaddb5d444154b1b523099285825ec8a6562`
- `CONSOLIDATED_CODE_EXPORT.txt` — 578082 bytes — SHA-256 `bdfb955cd514b959b6ba57b5eccaac974916f28563b4005c5fd3983a344ac957`
- `DEPENDENCY_SETUP.md` — 2249 bytes — SHA-256 `0a00a470761f01227f6f419a60cd2137ebdf4547c8c79070d48759c1ea84cfda`
- `DICTIONARY_PACK_FORMAT.md` — 7077 bytes — SHA-256 `b0e2f2c9330fc40dcf20985edcc7a6dc4d3b6bc1b44872ad516653292838f5b0`
- `electron-builder.app.config.js` — 1201 bytes — SHA-256 `47c9967ca141b822b7cf53814ccc756dc272d569cf31308e8f7967a33d45f3a2`
- `installer/install-linux.sh` — 1098 bytes — SHA-256 `762fc5068ca60271a10ef47125cebcd60f662ef4dd3857c437456ae0d7308122`
- `installer/mac-conclusion.txt` — 215 bytes — SHA-256 `c86bb6037292c00bff1b15d38040712c3a87aa819e3897b7a38f71106d1fd0fe`
- `installer/mac-welcome.txt` — 243 bytes — SHA-256 `e815901b642efc94db6e1740a2030a309da0300c2f29fbec3d011de7438fd140`
- `LANGUAGE_AND_DICTIONARY_PROTECTION.md` — 2392 bytes — SHA-256 `b7303a026577aab58c08b3f5b68e95a41bd6dfeb51b752d2e7e4499d543bf530`
- `LANGUAGE_PACK_FORMAT.md` — 1606 bytes — SHA-256 `fa7e05c564aa02bac225df7cb8b6d9c993bf4f4b741d66dfc1782e9dbbe38db8`
- `LICENSE` — 821 bytes — SHA-256 `8fa9335ec671084af1a50768fcb78e0b3e2d89e5e3a8ee9d5afcf727f3b63478`
- `MICROSOFT_365_REVERSE_ENGINEERING_SCOPE.md` — 1583 bytes — SHA-256 `092f2c3feae49c7f56af6e4be6ea8eb74c2c20372119b785d8e524d7b94d471d`
- `NODE24_DEVELOPMENT_ENVIRONMENT.md` — 3636 bytes — SHA-256 `ea5c5999bc0d19228ae0670dca8133efc0fa8cf99af35bda4dcf69d101e0c14a`
- `NODE24_PROVISIONING_REPORT.md` — 5807 bytes — SHA-256 `a2b72e27f366efac8012fa85b25ef0b89fb7523017db01a8add582edc841d594`
- `NODE24_SETUP_IMPLEMENTATION_REPORT.md` — 3001 bytes — SHA-256 `5e55d9d7ebbf1d7461dbc949381891b1e4fb9cb013775c5e7a9e61ffdd58e89d`
- `OPEN_SOURCE_APP_POLICY.md` — 1979 bytes — SHA-256 `d5815fa6500b69d25e8a78d0cc84a8996b906c3d0d910a14d5cb27c7685d129b`
- `package.json` — 4274 bytes — SHA-256 `ea8805ab21bc710e7f0a1432bbc3a8334bd2d39e93d37d41223b5fb0c4553a4b`
- `PRODUCT_PLAN.md` — 4895 bytes — SHA-256 `8403ea5e06ea6db1f029a3c6d1eaece58f3aa32747e6d81ed864317a2bbec44f`
- `PRODUCT_SCOPE_LOCK.md` — 2527 bytes — SHA-256 `b2c01a0730a5aba386f01b02c9baada30a58691ec1121d143ec87409dfdd4147`
- `PROJECT_MEMORY.md` — 9977 bytes — SHA-256 `ccf28326ca8c17664cc3aedcc6c16e0a4d446174abb24efe411d0f98d58f82d4`
- `README.md` — 18121 bytes — SHA-256 `95038a1365da4a49d316a8a5e629663cee0ac6d2f4471780099cc291881f7a08`
- `RELEASE_READINESS.md` — 8019 bytes — SHA-256 `dfca1e3d86e308693650656f4cabbee267ce268589364451381fb22a9c96e9ae`
- `RELEASE_SIGNING_SETUP.md` — 1843 bytes — SHA-256 `c198f0de2a12ced804d3b8c6ff56ea167a5efc3b84f8dbe56ef06029082e6b66`
- `REVERSE_ENGINEERING_SOURCE_REVIEW.md` — 15768 bytes — SHA-256 `ac0610b967a6a6deb7b41be97fe5cb194cdc2987890ca735c310d4d62c27af86`
- `scripts/activate-node24.sh` — 696 bytes — SHA-256 `0e21010b8e6799c08c33aff75d7800c37182b32a71d96e5693fb5d9550802eaf`
- `scripts/brightdesk-rea.js` — 8288 bytes — SHA-256 `126cac3a8e21796a9ef9db0e65bc90e09abf5fbefa46e43b58b15db3e0e4e616`
- `scripts/build-app.js` — 1002 bytes — SHA-256 `9bf2a1355896043281a139a796c78dca2b28d49b733632e13f163c697bacbf1a`
- `scripts/build-apps.js` — 718 bytes — SHA-256 `09a240316544af30e8753849b3f29f3dbe424a33d2b1112cc1399587c71dfa40`
- `scripts/check-node24.js` — 415 bytes — SHA-256 `74c7f31b71ebbdd68b17ddaceff47389d2380308c4b7761e6c6422dbb09dad0e`
- `scripts/fix-app-js.js` — 1901 bytes — SHA-256 `7f4b7ff79941935c5dd0d53a42ba34da52eab4702859b563bd267c8e83682bc7`
- `scripts/install-node24.ps1` — 3433 bytes — SHA-256 `41f7ef2c9bc929ce581dea610dd8bd0ad4093280555ab19d136faed10f448a81`
- `scripts/install-node24.sh` — 3551 bytes — SHA-256 `574ea544ea983d76533105c63688bf24acfe8369b4f99cbf9f4ef7c17938b215`
- `scripts/prepare-release-assets.js` — 1124 bytes — SHA-256 `17393ebaf69907654617b6342eea4e20754752b819dfd2e4ccf40fed68464623`
- `scripts/release-preflight.js` — 6654 bytes — SHA-256 `5f0421f4fe3440c1d84e44bfa34c6456324ba694dfcaefa5f7984fb35c9eceac`
- `scripts/setup/bootstrap-dev.js` — 1793 bytes — SHA-256 `52c2e9964c24dd810c46430a546c3d2a92e606de336c10978bd6ba1de9df56b8`
- `scripts/setup/install-dependencies.ps1` — 839 bytes — SHA-256 `908bd0bf5fd4a3ced43a97169085df5d861dd147960ff5c17384de9251eb0c28`
- `scripts/setup/install-dependencies.sh` — 1231 bytes — SHA-256 `61bba68a079a8e8c0a1d8c786ee929cfbc3b68df4f7588e791aa7a83923907cd`
- `scripts/use-node24.sh` — 658 bytes — SHA-256 `482d4a5d5ecd0034b97e0a80e99abbf772153f5be7f116b924f549a3d066fea2`
- `scripts/verify-licenses.js` — 6462 bytes — SHA-256 `2d5d09bc77058e9b0b310da64bb9b71e3c8f556eb355e331d6e5241759c6a753`
- `scripts/verify-lockfile.js` — 2109 bytes — SHA-256 `ab58958f1fb9ef992768bedcd20a9969d6f0826686680d87a12c8c531f4576b6`
- `scripts/verify-release-artifacts.js` — 3144 bytes — SHA-256 `3d823ba727f31170afe7b6e189e4aa389eaadb91af36fb71f3a48bd0be2ea7c9`
- `SOURCE_HISTORY.md` — 1316 bytes — SHA-256 `9e8297dccd0869faf509821781fe7824ee9b412d698d5c5a97194ea39d99031d`
- `src/app-catalog.js` — 3411 bytes — SHA-256 `3726756d6fc1746434741edf23f261ded944ec476bc981eddd32613a65708d31`
- `src/app.js` — 54235 bytes — SHA-256 `dc585f1ac2bc9741f4050ccd5d57d6047983619c6e39d054bee900633f0a9e21`
- `src/dictionary-catalog.json` — 30745 bytes — SHA-256 `919ece2c232e04525b1c6e9222a4fb202574292b165093cf886e11d37f4db4c2`
- `src/dictionary-service.js` — 31632 bytes — SHA-256 `481e8dc54e658fff5f0b690c4384caa21c5d22a96a716b8fd873ca9f94d6b432`
- `src/file-service.js` — 12964 bytes — SHA-256 `e139b109bd8370d2a68773f91a36f080afa421ce2ddb18e6c2b3b68b9d7e7f46`
- `src/formula.js` — 4334 bytes — SHA-256 `b8963e977972c8516e81fa281838b0eed88fcd7045d73c777895ab73bb721a42`
- `src/i18n.js` — 8187 bytes — SHA-256 `73ad80145aee22cf196cee8785680a21617db5943f14ccd087c04429504098b7`
- `src/index.html` — 9611 bytes — SHA-256 `a4aafe980559f0fcfe7e00d58f549e1f55286d53149f986df8a0ff6e26bdbbf3`
- `src/language-service.js` — 5642 bytes — SHA-256 `e794695204d7d639e1b2dc718477c0b9b88a717c6f8294beb3adb9abfa02b6a6`
- `src/languages/de-DE.json` — 8465 bytes — SHA-256 `104386c2626e6ae3fd0e760b73f565759512641e337da8c4d55e8a927c2f354e`
- `src/languages/en-AU.json` — 7859 bytes — SHA-256 `12bf43d4b1e35a1da8241354645691af8620b798a2b615be4c7be4e22817596d`
- `src/languages/es-ES.json` — 8504 bytes — SHA-256 `5309ebebaba6fa8fe275b10848ed190c72c6c2ca07b2fadb05b6760b30ea8881`
- `src/languages/fr-FR.json` — 8712 bytes — SHA-256 `267f3a8ef0c10424eb6cb7e12297a592deaaee85b6f42780f5c7acb2463da05d`
- `src/licenses/GPL-2.0.txt` — 17984 bytes — SHA-256 `edaef632cbb643e4e7a221717a6c441a4c1a7c918e6e4d56debc3d8739b233f6`
- `src/licenses/LGPL-2.1.txt` — 26419 bytes — SHA-256 `20e50fe7aae3e56378ebf0417d9de904f55a0e61e4df315333e632a4d3555d95`
- `src/licenses/README.md` — 711 bytes — SHA-256 `28f74ebc067dcf4dbd44905f597ff0a71b37d359cfe5b84fe9f091b435db32ee`
- `src/main.js` — 18759 bytes — SHA-256 `380648772292ede97b33c3bf0c2c281461fbba2f228acb65b1c0892f2a676a20`
- `src/preload.js` — 1738 bytes — SHA-256 `de6e056a117f9399c05ffe07072b3a5a8306ad023ad001b39b38b0d692d36e80`
- `src/styles.css` — 16794 bytes — SHA-256 `cefc4e2fe5cd3f4a33c8f6ffe1239664e9b8314dd6fc347430f41ab413e15792`
- `src/terms-preload.js` — 291 bytes — SHA-256 `d8dad2f08e8ac081fef75e7525efb959fa468829d9cae0dd01cad616ce0a95a3`
- `src/terms.html` — 1844 bytes — SHA-256 `db2a9a590ee8943a5541767e03a115923ad6c1f51e10784df2075bbf3741f475`
- `src/terms.js` — 900 bytes — SHA-256 `e0dc3b9c271ab2a45f36ce6798cd6bd1ba248ad1fc116ffeb71b0c723bb33c8a`
- `TERMS_AND_CONDITIONS.txt` — 3344 bytes — SHA-256 `0afd25c784b7479684fe93a2cc4e02d2564c363f1678532b63a83f873b76b05d`
- `tests/app-catalog.test.js` — 7355 bytes — SHA-256 `ef6b1acdc2ecc41fd48a75498672ac21b6c08acb502e2f3b1c9c667217da37d4`
- `tests/dictionary-service-live.test.js` — 2640 bytes — SHA-256 `da7b8b1a0a69c55986f0b8d116c69d3227db10aa3979e6d5fd2b2db025681db6`
- `tests/dictionary-service.test.js` — 11853 bytes — SHA-256 `7820f66993958f2d76c1ba2b735e0fe0154a078bf9fcdd7e0ca6f392ee444243`
- `tests/file-service.test.js` — 4468 bytes — SHA-256 `88d1b3aada1eba6755566bad68ae9d150356453af0ae425ebcf154051c20b54c`
- `tests/formula.test.js` — 1257 bytes — SHA-256 `115eabab1d750f98c0f3c2fdcaed6d216edde6b8373422644567eefa816676e6`
- `tests/installer-agreement.test.js` — 3523 bytes — SHA-256 `fa0171276460c2908027a8428f6405a910f2f6871e684df558a5d617c4fc180e`
- `tests/language-service.test.js` — 1934 bytes — SHA-256 `54bed2db8efcfd9c766d7e8057301994be604fbcf88d9e52b599a276560ca236`
- `tests/license-verification.test.js` — 2708 bytes — SHA-256 `0c8095059a964b754411d78d1cf89f5f48718e5ca00aa409e9996d1dbddeec95`
- `tests/node-runtime-setup.test.js` — 3420 bytes — SHA-256 `5e8b30eeecc37388dc5bb40bfe8ac25adabd4c5cf232ec136f6e43ee8b53c4c4`
- `tests/rea-bench.test.js` — 1177 bytes — SHA-256 `d65859b5ec85f2cef4bab2f58df2e7097cb445cbb8e8300d7bd0b5011b0bdd8d`
- `tests/release-readiness.test.js` — 4975 bytes — SHA-256 `b4d7f637d6b01a3b274cf453409b7ac1ff35fcce980892a3ba1f976619379cb9`
- `tests/release-workflows.test.js` — 5177 bytes — SHA-256 `253798f1bd0710a5ba5ece80867a86edec911f1dc342ed8c2000c362d2929854`
- `tests/resource-protection.test.js` — 3279 bytes — SHA-256 `5dc844cdce15dd177eb47f6291709c04d1ca9b0ba52ddd109ed14c61930c6fc3`
- `THIRD_PARTY_NOTICES.md` — 1070 bytes — SHA-256 `a460c15a7136f9be17d0dcbdd3c74c8602f9afbbcef9cbeb43b28ca8cebf387a`
- `WORLD_LANGUAGE_DICTIONARIES.md` — 7663 bytes — SHA-256 `dd35be9371d548f851da6f06737ccbd76382a89c86570331663e117d07b25c51`
