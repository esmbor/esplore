"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { categories } from "../data/categories";

export default function AddPlaceForm() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const [mainImageFile, setMainImageFile] =
    useState<File | null>(null);

  const [mainImagePreview, setMainImagePreview] =
    useState<string | null>(null);

  const [galleryFiles, setGalleryFiles] =
    useState<File[]>([]);

  const [galleryPreviews, setGalleryPreviews] =
    useState<string[]>([]);

  useEffect(() => {
    return () => {
      if (
        mainImagePreview &&
        mainImagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(mainImagePreview);
      }

      galleryPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [mainImagePreview, galleryPreviews]);

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

  function handleGalleryChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (files.length === 0) return;

    galleryPreviews.forEach((preview) => {
      URL.revokeObjectURL(preview);
    });

    setGalleryFiles(files);

    setGalleryPreviews(
      files.map((file) =>
        URL.createObjectURL(file)
      )
    );
  }

  function removeNewGalleryImage(
    indexToRemove: number
  ) {
    const preview =
      galleryPreviews[indexToRemove];

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setGalleryFiles((current) =>
      current.filter(
        (_, index) => index !== indexToRemove
      )
    );

    setGalleryPreviews((current) =>
      current.filter(
        (_, index) => index !== indexToRemove
      )
    );
  }

  function createSafeSlug(slug: string) {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
  }

  async function uploadMainImage(
    file: File,
    slug: string
  ) {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ?? "jpg";

    const safeSlug =
      createSafeSlug(slug);

    const filePath =
      `${safeSlug}/main-${Date.now()}.${extension}`;

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

    return data.publicUrl;
  }

  async function uploadGalleryImages(
    files: File[],
    slug: string,
    placeId: string
  ) {
    const safeSlug =
      createSafeSlug(slug);

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
            placeId,
            imageUrl: data.publicUrl,
            sortOrder: index + 1,
          });

      if (insertError) {
        throw insertError;
      }
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

      const name = String(
        formData.get("name") ?? ""
      );

      const slug = String(
        formData.get("slug") ?? ""
      );

      let mainImageUrl = "";

      if (mainImageFile) {
        mainImageUrl =
          await uploadMainImage(
            mainImageFile,
            slug
          );
      }

      const {
        data: newPlace,
        error: placeError,
      } = await supabase
        .from("places")
        .insert({
          name,
          slug,

          city: String(
            formData.get("city") ?? ""
          ),

          country: String(
            formData.get("country") ?? ""
          ),

          category: String(
            formData.get("category") ?? ""
          ),

          rating: Number(
            formData.get("rating")
          ),

          description: String(
            formData.get("description") ?? ""
          ),

          image: mainImageUrl,

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
            formData.get("worthADetour") === "on",

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

          featured:
            formData.get("featured") === "on",
        })
        .select("id")
        .single();

      if (placeError) {
        throw placeError;
      }

      if (!newPlace) {
        throw new Error(
          "The place was created but no place ID was returned."
        );
      }

      if (galleryFiles.length > 0) {
        await uploadGalleryImages(
          galleryFiles,
          slug,
          newPlace.id
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (error: any) {
      console.error("ADD PLACE ERROR:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        error,
      });

      setErrorMessage(
        error?.message ??
          error?.details ??
          "Something went wrong while adding the place."
      );

      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Basic information
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Name"
            name="name"
            required
          />

          <Field
            label="Slug"
            name="slug"
            placeholder="tim-wendelboe"
            required
          />

          <Field
            label="City"
            name="city"
            required
          />

          <Field
            label="Country"
            name="country"
            required
          />

          <div>
            <label
              htmlFor="category"
              className="text-sm font-medium text-stone-700"
            >
              Category
            </label>

            <select
              id="category"
              name="category"
              required
              className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
            >
              {categories
                .filter(
                  (category) =>
                    category !== "All"
                )
                .map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
            </select>
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
              defaultValue="5"
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

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Description
        </h2>

        <div className="mt-6 space-y-5">
          <TextArea
            label="Description"
            name="description"
          />

          <TextArea
            label="Why I recommend it"
            name="whyRecommend"
          />

          <TextArea
            label="What to order"
            name="whatToOrder"
          />

          <TextArea
            label="Good to know"
            name="goodToKnow"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Quick facts
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Price level"
            name="priceLevel"
            placeholder="€€"
          />

          <Field
            label="Best for"
            name="bestFor"
            placeholder="Specialty coffee"
          />

          <Field
            label="Visited"
            name="visited"
            placeholder="August 2026"
          />

          <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
            <input
              type="checkbox"
              name="worthADetour"
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

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Location
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Used to place the recommendation on the map.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            required
          />

          <Field
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            required
          />
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Main image
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          The main photo used on cards and at the top of
          the place page.
        </p>

        {mainImagePreview ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
            <div className="aspect-[16/9]">
              <img
                src={mainImagePreview}
                alt="Main image preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50">
            <p className="text-sm text-stone-400">
              No main image selected
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
              : "Choose image"}
          </label>

          <input
            id="mainImage"
            type="file"
            accept="image/*"
            onChange={handleMainImageChange}
            className="sr-only"
          />

          <p className="mt-3 text-xs text-stone-400">
            Choose a photo from your computer or phone.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Gallery
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Add extra photos to the place gallery.
        </p>

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
            onChange={handleGalleryChange}
            className="sr-only"
          />

          <p className="mt-3 text-xs text-stone-400">
            You can select multiple photos at once.
          </p>
        </div>

        {galleryPreviews.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {galleryPreviews.map(
              (preview, index) => (
                <div
                  key={preview}
                  className="group relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                >
                  <div className="aspect-[4/3]">
                    <img
                      src={preview}
                      alt={`Gallery preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/90 px-2 text-xs font-medium text-stone-700 shadow-sm">
                    {index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeNewGalleryImage(
                        index
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
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="featured"
            className="mt-1 h-4 w-4 rounded border-stone-300"
          />

          <div>
            <p className="text-sm font-medium text-stone-700">
              Featured place
            </p>

            <p className="mt-1 text-sm text-stone-500">
              Show this place in the featured section on
              the homepage.
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
          disabled={saving}
          className="rounded-full bg-stone-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Uploading & creating..."
            : "Add place"}
        </button>
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
};

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  step,
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
        className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
}: {
  label: string;
  name: string;
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
        className="mt-2 w-full resize-y rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-stone-500"
      />
    </div>
  );
}