"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { categories } from "../data/categories";

type GalleryImage = {
  id: string;
  imageUrl: string;
  sortOrder: number;
};

type Place = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  category: string;
  categories: string[] | null;
  rating: number;
  description: string | null;
  image: string | null;
  whyRecommend: string | null;
  whatToOrder: string | null;
  goodToKnow: string | null;
  priceLevel: string | null;
  worthADetour: boolean;
  bestFor: string | null;
  visited: string | null;
  latitude: number | null;
  longitude: number | null;
  externalUrl: string | null;
  googleMapsUrl: string | null;
  featured: boolean;
  gallery: GalleryImage[];
};

type EditPlaceFormProps = {
  place: Place;
};

export default function EditPlaceForm({
  place,
}: EditPlaceFormProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] =
    useState(false);
  const [deleting, setDeleting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [mainImageFile, setMainImageFile] =
    useState<File | null>(null);

  const [mainImagePreview, setMainImagePreview] =
    useState<string | null>(place.image);

  const [galleryImages, setGalleryImages] =
    useState<GalleryImage[]>(place.gallery);

  const [newGalleryFiles, setNewGalleryFiles] =
    useState<File[]>([]);

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(
      place.categories?.length
        ? place.categories
        : place.category
          ? [place.category]
          : []
    );

  const [
    newGalleryPreviews,
    setNewGalleryPreviews,
  ] = useState<string[]>([]);

  const [draggedImageId, setDraggedImageId] =
    useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (
        mainImagePreview &&
        mainImagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(mainImagePreview);
      }

      newGalleryPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [mainImagePreview, newGalleryPreviews]);

  function createSafeSlug(slug: string) {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
  }

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function getStoragePathFromPublicUrl(
    imageUrl: string
  ) {
    const publicPrefix =
      "/storage/v1/object/public/place-images/";

    if (!imageUrl.includes(publicPrefix)) {
      return null;
    }

    const path =
      imageUrl.split(publicPrefix)[1];

    if (!path) return null;

    return decodeURIComponent(path);
  }

  function handleMainImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      mainImagePreview &&
      mainImagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(mainImagePreview);
    }

    setMainImageFile(file);
    setMainImagePreview(
      URL.createObjectURL(file)
    );
  }

  function handleGalleryFilesChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (files.length === 0) return;

    newGalleryPreviews.forEach((preview) => {
      URL.revokeObjectURL(preview);
    });

    setNewGalleryFiles(files);

    setNewGalleryPreviews(
      files.map((file) =>
        URL.createObjectURL(file)
      )
    );
  }

  async function uploadMainImage(
    file: File,
    slug: string
  ) {
    const safeSlug = createSafeSlug(slug);

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ?? "jpg";

    const fileName =
      `main-${Date.now()}.${extension}`;

    const filePath =
      `${safeSlug}/${fileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("place-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("place-images")
      .getPublicUrl(filePath);

    return {
      publicUrl: data.publicUrl,
      fileName,
    };
  }

  async function cleanupMainImages(
    slug: string,
    keepFileName: string
  ) {
    const safeSlug =
      createSafeSlug(slug);

    const {
      data: files,
      error: listError,
    } = await supabase.storage
      .from("place-images")
      .list(safeSlug, {
        limit: 1000,
        offset: 0,
      });

    if (listError) {
      throw listError;
    }

    const oldMainPaths =
      (files ?? [])
        .filter(
          (file) =>
            file.name.startsWith("main-") &&
            file.name !== keepFileName
        )
        .map(
          (file) =>
            `${safeSlug}/${file.name}`
        );

    if (oldMainPaths.length === 0) {
      return;
    }

    const { error: deleteError } =
      await supabase.storage
        .from("place-images")
        .remove(oldMainPaths);

    if (deleteError) {
      throw deleteError;
    }
  }

  async function uploadGalleryImages(
    files: File[],
    slug: string
  ) {
    if (files.length === 0) return;

    const safeSlug =
      createSafeSlug(slug);

    const existingMaxSortOrder =
      galleryImages.length > 0
        ? Math.max(
            ...galleryImages.map(
              (image) => image.sortOrder
            )
          )
        : 0;

    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const file = files[index];

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ?? "jpg";

      const filePath =
        `${safeSlug}/gallery-${Date.now()}-${index}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("place-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("place-images")
        .getPublicUrl(filePath);

      const { error: insertError } =
        await supabase
          .from("placeImages")
          .insert({
            placeId: place.id,
            imageUrl: data.publicUrl,
            sortOrder:
              existingMaxSortOrder +
              index +
              1,
          });

      if (insertError) {
        throw insertError;
      }
    }
  }

  async function deleteGalleryImage(
    image: GalleryImage
  ) {
    const confirmed = window.confirm(
      "Remove this gallery image?"
    );

    if (!confirmed) return;

    setErrorMessage("");

    try {
      const { error: rowError } =
        await supabase
          .from("placeImages")
          .delete()
          .eq("id", image.id);

      if (rowError) {
        throw rowError;
      }

      const storagePath =
        getStoragePathFromPublicUrl(
          image.imageUrl
        );

      if (storagePath) {
        const { error: storageError } =
          await supabase.storage
            .from("place-images")
            .remove([storagePath]);

        if (storageError) {
          console.error(
            "STORAGE DELETE ERROR:",
            storageError
          );
        }
      }

      setGalleryImages((current) =>
        current.filter(
          (galleryImage) =>
            galleryImage.id !== image.id
        )
      );
    } catch (error: any) {
      console.error(
        "DELETE GALLERY ERROR:",
        error
      );

      setErrorMessage(
        error?.message ??
          "Could not remove the gallery image."
      );
    }
  }

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    imageId: string
  ) {
    setDraggedImageId(imageId);
    event.dataTransfer.effectAllowed =
      "move";
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect =
      "move";
  }

  async function handleDrop(
    event: DragEvent<HTMLDivElement>,
    targetImageId: string
  ) {
    event.preventDefault();

    if (
      !draggedImageId ||
      draggedImageId === targetImageId
    ) {
      setDraggedImageId(null);
      return;
    }

    const currentImages = [
      ...galleryImages,
    ];

    const draggedIndex =
      currentImages.findIndex(
        (image) =>
          image.id === draggedImageId
      );

    const targetIndex =
      currentImages.findIndex(
        (image) =>
          image.id === targetImageId
      );

    if (
      draggedIndex === -1 ||
      targetIndex === -1
    ) {
      setDraggedImageId(null);
      return;
    }

    const [draggedImage] =
      currentImages.splice(
        draggedIndex,
        1
      );

    currentImages.splice(
      targetIndex,
      0,
      draggedImage
    );

    const reorderedImages =
      currentImages.map(
        (image, index) => ({
          ...image,
          sortOrder: index + 1,
        })
      );

    setGalleryImages(reorderedImages);
    setDraggedImageId(null);
    setReordering(true);
    setErrorMessage("");

    try {
      for (const image of reorderedImages) {
        const { error } =
          await supabase
            .from("placeImages")
            .update({
              sortOrder:
                image.sortOrder,
            })
            .eq("id", image.id);

        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
      console.error(
        "REORDER ERROR:",
        error
      );

      setErrorMessage(
        error?.message ??
          "Could not save the new image order."
      );
    } finally {
      setReordering(false);
    }
  }

  async function handleDeletePlace() {
    const confirmed = window.confirm(
      `Delete "${place.name}"?\n\nThis will permanently remove the place and its uploaded images. This cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage("");

    try {
      const safeSlug =
        createSafeSlug(place.slug);

      const {
        data: storedFiles,
        error: listError,
      } = await supabase.storage
        .from("place-images")
        .list(safeSlug, {
          limit: 1000,
          offset: 0,
        });

      if (listError) {
        throw listError;
      }

      const filePaths =
        (storedFiles ?? [])
          .filter(
            (file) =>
              file.name &&
              file.name !==
                ".emptyFolderPlaceholder"
          )
          .map(
            (file) =>
              `${safeSlug}/${file.name}`
          );

      if (filePaths.length > 0) {
        const { error: removeError } =
          await supabase.storage
            .from("place-images")
            .remove(filePaths);

        if (removeError) {
          throw removeError;
        }
      }

      const { error: deleteError } =
        await supabase
          .from("places")
          .delete()
          .eq("id", place.id);

      if (deleteError) {
        throw deleteError;
      }

      router.replace("/admin");
      router.refresh();
    } catch (error: any) {
      console.error(
        "DELETE PLACE ERROR:",
        error
      );

      setErrorMessage(
        error?.message ??
          "Could not delete the place."
      );

      setDeleting(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    try {
      const formData = new FormData(
        event.currentTarget
      );

      if (selectedCategories.length === 0) {
        throw new Error(
          "Please select at least one category."
        );
      }

      const name = String(
        formData.get("name") ?? ""
      );

      const slug = String(
        formData.get("slug") ?? ""
      );

      let newMainImageUrl =
        place.image ?? "";

      let newMainFileName:
        | string
        | null = null;

      if (mainImageFile) {
        const uploadedMain =
          await uploadMainImage(
            mainImageFile,
            slug
          );

        newMainImageUrl =
          uploadedMain.publicUrl;

        newMainFileName =
          uploadedMain.fileName;
      }

      const updatedPlace = {
        name,
        slug,

        city: String(
          formData.get("city") ?? ""
        ),

        country: String(
          formData.get("country") ?? ""
        ),

        category: selectedCategories[0],
        categories: selectedCategories,

        rating: Number(
          formData.get("rating")
        ),

        description: String(
          formData.get("description") ?? ""
        ),

        image: newMainImageUrl,

        whyRecommend: String(
          formData.get("whyRecommend") ?? ""
        ),

        whatToOrder: String(
          formData.get("whatToOrder") ?? ""
        ),

        goodToKnow: String(
          formData.get("goodToKnow") ?? ""
        ),

        priceLevel: String(
          formData.get("priceLevel") ?? ""
        ),

        worthADetour:
          formData.get("worthADetour") ===
          "on",

        bestFor: String(
          formData.get("bestFor") ?? ""
        ),

        visited: String(
          formData.get("visited") ?? ""
        ),

        latitude: Number(
          formData.get("latitude")
        ),

        longitude: Number(
          formData.get("longitude")
        ),

        externalUrl: String(
          formData.get("externalUrl") ?? ""
        ).trim(),

        googleMapsUrl: String(
          formData.get("googleMapsUrl") ?? ""
        ).trim(),

        featured:
          formData.get("featured") ===
          "on",
      };

      const { error } = await supabase
        .from("places")
        .update(updatedPlace)
        .eq("id", place.id);

      if (error) {
        throw error;
      }

      if (
        mainImageFile &&
        newMainFileName
      ) {
        await cleanupMainImages(
          slug,
          newMainFileName
        );
      }

      if (
        newGalleryFiles.length > 0
      ) {
        await uploadGalleryImages(
          newGalleryFiles,
          slug
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (error: any) {
      console.error("SAVE ERROR:", error);

      setErrorMessage(
        error?.message ??
          error?.details ??
          "Something went wrong while saving."
      );

      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* BASIC INFORMATION */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Basic information
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Name"
            name="name"
            defaultValue={place.name}
            required
          />

          <Field
            label="Slug"
            name="slug"
            defaultValue={place.slug}
            required
          />

          <Field
            label="City"
            name="city"
            defaultValue={place.city}
            required
          />

          <Field
            label="Country"
            name="country"
            defaultValue={place.country}
            required
          />

          <div>
            <p className="text-sm font-medium text-stone-700">
              Categories
            </p>

            <p className="mt-1 text-xs text-stone-500">
              Select one or more categories. The first selected
              category will be used as the primary category.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {categories
                .filter((category) => category !== "All")
                .map((category) => {
                  const selected =
                    selectedCategories.includes(category);

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selected
                          ? "border-stone-800 bg-stone-800 text-white"
                          : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
            </div>
          </div>

          <div>
            <label
              htmlFor="rating"
              className="text-sm font-medium text-stone-700"
            >
              Rating
            </label>

            <select
              id="rating"
              name="rating"
              defaultValue={place.rating}
              className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            >
              {[1, 2, 3, 4, 5].map(
                (rating) => (
                  <option
                    key={rating}
                    value={rating}
                  >
                    {rating}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Description
        </h2>

        <div className="mt-6 space-y-5">
          <TextArea
            label="Description"
            name="description"
            defaultValue={
              place.description ?? ""
            }
          />

          <TextArea
            label="Why I recommend it"
            name="whyRecommend"
            defaultValue={
              place.whyRecommend ?? ""
            }
          />

          <TextArea
            label="What to order"
            name="whatToOrder"
            defaultValue={
              place.whatToOrder ?? ""
            }
          />

          <TextArea
            label="Good to know"
            name="goodToKnow"
            defaultValue={
              place.goodToKnow ?? ""
            }
          />
        </div>
      </div>

      {/* QUICK FACTS */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Quick facts
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Price level"
            name="priceLevel"
            defaultValue={
              place.priceLevel ?? ""
            }
          />

          <Field
            label="Best for"
            name="bestFor"
            defaultValue={
              place.bestFor ?? ""
            }
          />

          <Field
            label="Visited"
            name="visited"
            defaultValue={
              place.visited ?? ""
            }
          />

          <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
            <input
              type="checkbox"
              name="worthADetour"
              defaultChecked={
                place.worthADetour
              }
              className="mt-1 h-4 w-4 rounded border-stone-300"
            />

            <div>
              <p className="text-sm font-medium text-stone-700">
                Worth a detour
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                Mark this if you would specifically
                recommend going out of the way for it.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* LINKS */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Links
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Add useful external links for this place.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <Field
              label="Website"
              name="externalUrl"
              type="url"
              placeholder="https://example.com"
              defaultValue={place.externalUrl ?? ""}
            />

            <p className="mt-2 text-xs leading-5 text-stone-400">
              This can also be an Instagram page, booking
              page, trail page or another useful link.
            </p>
          </div>

          <div>
            <Field
              label="Google Maps"
              name="googleMapsUrl"
              type="url"
              placeholder="https://maps.app.goo.gl/..."
              defaultValue={place.googleMapsUrl ?? ""}
            />

            <p className="mt-2 text-xs leading-5 text-stone-400">
              In Google Maps, choose Share → Copy link.
            </p>
          </div>
        </div>
      </div>

      {/* LOCATION */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Location
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={
              place.latitude ?? ""
            }
            required
          />

          <Field
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={
              place.longitude ?? ""
            }
            required
          />
        </div>
      </div>

      {/* MAIN IMAGE */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Main image
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          This is the main photo shown on the place
          page and recommendation cards.
        </p>

        {mainImagePreview ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
            <div className="aspect-[16/9]">
              <img
                src={mainImagePreview}
                alt={`${place.name} main image`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50">
            <p className="text-sm text-stone-400">
              No main image yet
            </p>
          </div>
        )}

        <div className="mt-5">
          <label
            htmlFor="mainImage"
            className="inline-flex cursor-pointer items-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            {mainImagePreview
              ? "Replace image"
              : "Upload image"}
          </label>

          <input
            id="mainImage"
            type="file"
            accept="image/*"
            onChange={handleMainImageChange}
            className="sr-only"
          />
        </div>
      </div>

      {/* GALLERY */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold">
              Gallery
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              Drag photos to change the order they
              appear on the place page.
            </p>
          </div>

          {reordering && (
            <p className="text-xs text-stone-400">
              Saving order…
            </p>
          )}
        </div>

        {galleryImages.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {galleryImages.map(
              (image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(event) =>
                    handleDragStart(
                      event,
                      image.id
                    )
                  }
                  onDragOver={handleDragOver}
                  onDrop={(event) =>
                    handleDrop(
                      event,
                      image.id
                    )
                  }
                  className={`group relative cursor-grab overflow-hidden rounded-xl border bg-stone-100 transition active:cursor-grabbing ${
                    draggedImageId === image.id
                      ? "scale-[0.98] border-stone-400 opacity-50"
                      : "border-stone-200"
                  }`}
                >
                  <div className="aspect-[4/3]">
                    <img
                      src={image.imageUrl}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/90 px-2 text-xs font-medium text-stone-700 shadow-sm">
                    {index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      deleteGalleryImage(
                        image
                      )
                    }
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-white"
                  >
                    Remove
                  </button>
                </div>
              )
            )}
          </div>
        )}

        <div className="mt-6">
          <label
            htmlFor="galleryImages"
            className="inline-flex cursor-pointer items-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Add gallery photos
          </label>

          <input
            id="galleryImages"
            type="file"
            accept="image/*"
            multiple
            onChange={
              handleGalleryFilesChange
            }
            className="sr-only"
          />
        </div>

        {newGalleryPreviews.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">
              New photos
            </p>

            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {newGalleryPreviews.map(
                (preview, index) => (
                  <div
                    key={preview}
                    className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                  >
                    <div className="aspect-[4/3]">
                      <img
                        src={preview}
                        alt={`New gallery photo ${
                          index + 1
                        }`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* FEATURED */}

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={place.featured}
            className="mt-1 h-4 w-4 rounded border-stone-300"
          />

          <div>
            <p className="text-sm font-medium text-stone-700">
              Featured place
            </p>

            <p className="mt-1 text-sm text-stone-500">
              Show this place in the featured section
              on the homepage.
            </p>
          </div>
        </label>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            router.push("/admin")
          }
          className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            saving ||
            reordering ||
            deleting
          }
          className="rounded-full bg-stone-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Uploading & saving..."
            : "Save changes"}
        </button>
      </div>

      {/* DANGER ZONE */}

      <div className="border-t border-stone-200 pt-8">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-900">
                Delete this place
              </p>

              <p className="mt-1 max-w-lg text-sm leading-6 text-red-700">
                Permanently remove this place, its
                gallery records and its uploaded
                images. This action cannot be undone.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDeletePlace}
              disabled={
                deleting ||
                saving ||
                reordering
              }
              className="shrink-0 rounded-full border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting
                ? "Deleting..."
                : "Delete place"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  defaultValue?: string | number;
};

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  step,
  defaultValue,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="text-sm font-medium text-stone-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        step={step}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-500"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="text-sm font-medium text-stone-700"
      >
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        rows={4}
        defaultValue={defaultValue}
        className="mt-2 w-full resize-y rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-stone-500"
      />
    </div>
  );
}