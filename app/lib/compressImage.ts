export async function compressImage(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
) {
  const {
    maxWidth = 1800,
    maxHeight = 1800,
    quality = 0.82,
  } = options ?? {};

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(
    maxWidth / bitmap.width,
    maxHeight / bitmap.height,
    1
  );

  const width = Math.round(
    bitmap.width * scale
  );

  const height = Math.round(
    bitmap.height * scale
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    bitmap.close();

    throw new Error(
      "Could not prepare image compression."
    );
  }

  context.drawImage(
    bitmap,
    0,
    0,
    width,
    height
  );

  bitmap.close();

  const blob = await new Promise<Blob>(
    (resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(
              new Error(
                "Could not compress image."
              )
            );
          }
        },
        "image/webp",
        quality
      );
    }
  );

  const originalName =
    file.name.replace(
      /\.[^.]+$/,
      ""
    );

  return new File(
    [blob],
    `${originalName}.webp`,
    {
      type: "image/webp",
      lastModified: Date.now(),
    }
  );
}