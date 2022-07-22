import codeTransformer, { CodeBlockStats } from "../util/codeBlockTransformer";
import imageTransformer, { ImageStats } from "../util/imageTransformer";
import preset from "../.remarkrc.js";

import { read, write } from "to-vfile";

import extract from "remark-extract-frontmatter";
import fg from "fast-glob";
import frontmatter from "remark-frontmatter";
import mdx from "remark-mdx";
import remark from "remark";
import { parse as yaml } from "yaml";

// Main
(async () => {
  const stream = fg.stream(["../content/**/*.mdx"]);

  let stats: CodeBlockStats & ImageStats = {
    totalSnapshots: 0,
    updatedSnapshots: [],
    totalImages: 0,
    updatedImages: [],
  };
  const setCodeBlockStats = (newStats: CodeBlockStats) => {
    const { totalSnapshots, updatedSnapshots } = newStats;
    stats.totalSnapshots += totalSnapshots;
    stats.updatedSnapshots = stats.updatedSnapshots.concat(updatedSnapshots);
  };
  const setImageStats = (newStats: ImageStats) => {
    const { totalImages, updatedImages } = newStats;
    stats.totalImages += totalImages;
    stats.updatedImages = stats.updatedImages.concat(updatedImages);
  };
  for await (const path of stream) {
    const file = await read(path);
    const contents = await remark()
      .use(frontmatter)
      .use(extract, { yaml: yaml })
      .use(mdx)
      .use(codeTransformer, { setCodeBlockStats })
      .use(imageTransformer, { setImageStats })
      .use(preset)
      .process(file);

    await write({
      path,
      contents: Buffer.from(contents.toString()),
    });
  }

  console.log(`✅ ${stats.totalCodeBlocks} code blocks parsed`);
  if (stats.updatedCodeBlocks.length) {
    console.log(`⚡️ ${stats.updatedCodeBlocks.length} updated:`);
    console.log(`\t${stats.updatedCodeBlocks.join("\n\t")}`);
  } else {
    console.log(`✨ No code blocks were updated`);
  }

  console.log(`✅ ${stats.totalImages} images parsed`);
  if (stats.updatedImages.length) {
    console.log(`⚡️ ${stats.updatedImages.length} updated:`);
    console.log(`\t${stats.updatedImages.join("\n\t")}`);
  } else {
    console.log(`✨ No images were updated`);
  }
})();
