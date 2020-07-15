# covid19kerala.info Main website

This project is a clone of [https://covid19japan.com/](https://covid19japan.com/). Built and maintained by [Shane Reustle](https://twitter.com/reustle) ([Reustle K.K.](https://reustle.co)) and [many other contributors](https://github.com/reustle/covid19japan/graphs/contributors). Original concept and design by [Jiahui Zhou](https://jiahuizhou.design/).

## CODD-K Members

List of CODD-K members is plublished at [https://team.covid19kerala.info/](https://team.covid19kerala.info/)

## Contributing Code

If you would like to contribute features / refactor / etc, please open an Issue on this repo - We can then open a new Pull Request if it is deemed in line with the projects goals.

### Requirements

- NodeJS

### Build Instructions

Set up environment

```
npm install
```

Build once:

```
npm run build
```

Build continuously:

```
npm run watch
```

Start Server:

```
npm run start

# or run continuous build + server
npm run start-webpack
```

Build for production (minified):

```
npm run build-prod
```

You will now be able to access the site at http://localhost:4000/

## Code Re-use

The code for this project is released under the [MIT License](LICENSE). You are free to re-use it but we ask that you please include a link back to the [COVID-19 Japan website](https://covid19japan.com/) or [the GitHub repository](https://github.com/reustle/covid19japan).
