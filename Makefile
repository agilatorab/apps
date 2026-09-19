.PHONY: build check serve clean

# Generate the site into dist/.
build:
	node scripts/build.mjs

# Fail if a page links anywhere but the store, this site, or our contact. CI runs this.
check: build
	node scripts/check.mjs

# Look at it locally: http://localhost:8000
serve: build
	cd dist && python3.12 -m http.server 8000

clean:
	rm -rf dist
