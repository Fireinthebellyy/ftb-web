"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import gsap from "gsap";

function TestimonialRow({
  images,
  reverse = false,
  secondRow = false,
}: {
  images: string[];
  reverse?: boolean;
  secondRow?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const firstGroupRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const firstGroup = firstGroupRef.current;
    const track = trackRef.current;

    if (!row || !firstGroup || !track || images.length === 0) return;

    const ctx = gsap.context(() => {
      const createAnimation = () => {
        const loopWidth = firstGroup.offsetWidth;

        if (!loopWidth) return;

        gsap.killTweensOf(track);

        gsap.set(track, {
          x: reverse ? -loopWidth : 0,
        });

        gsap.to(track, {
          x: reverse ? 0 : -loopWidth,
          duration: secondRow ? 250 : 250,
          ease: "none",
          repeat: -1,
        });
      };

      createAnimation();

      const resizeObserver = new ResizeObserver(() => {
        createAnimation();
      });

      resizeObserver.observe(firstGroup);

      return () => {
        resizeObserver.disconnect();
      };
    }, row);

    return () => {
      ctx.revert();
    };
  }, [images, reverse, secondRow]);

  const renderCards = (group: "first" | "second") =>
    images.map((image, index) => (
      <div
        key={`${group}-${image}-${index}`}
        className="
          relative
          flex
          h-[72px]
          w-[165px]
          shrink-0
          items-center
          justify-center
          mr-3

          xs:h-[78px]
          xs:w-[180px]
          xs:mr-3

          sm:h-[94px]
          sm:w-[220px]
          sm:mr-4

          md:h-[110px]
          md:w-[255px]
          md:mr-4

          lg:h-[125px]
          lg:w-[290px]
          lg:mr-5

          xl:h-[138px]
          xl:w-[200px]
          xl:mr-5
        "
      >
        <div
          className="
            relative
            flex
            h-full
            w-full
            items-center
            justify-center
            overflow-hidden
            rounded-[10px]
            bg-[#171d1f]

            xs:rounded-[10px]

            sm:rounded-[12px]

            lg:rounded-[14px]
          "
        >
          <img
            src={image}
            alt=""
            className="
              block
              h-full
              w-full
              object-contain
            "
          />
        </div>
      </div>
    ));

  return (
    <div
      ref={rowRef}
      className="
        relative
        h-[88px]
        w-full
        overflow-visible

        xs:h-[94px]

        sm:h-[112px]

        md:h-[132px]

        lg:h-[150px]

        xl:h-[165px]
      "
    >
      <div
        className="
          absolute
          left-0
          top-1/2
          w-full
          overflow-visible
        "
        style={{
          transform: "translateY(-50%)",
        }}
      >
        <div
          ref={trackRef}
          className="flex w-max"
        >
          {/* FIRST GROUP */}
<div
  ref={firstGroupRef}
  className="
    flex
    shrink-0
    items-center
    gap-2
    xs:gap-2.5
    sm:gap-3
  "
>
  {renderCards("first")}
</div>

{/* DUPLICATE GROUPS FOR SEAMLESS LOOP */}
{Array.from({ length: 8 }).map((_, index) => (
  <div
    key={`duplicate-${index}`}
    className="
      flex
      shrink-0
      items-center
      gap-2
      xs:gap-2.5
      sm:gap-3
    "
  >
    {renderCards("second")}
  </div>
))}
        </div>
      </div>
    </div>
  );
}

export function ToolkitTestimonials({
  images,
}: {
  images: string[];
}) {
  const { data: fetchedTestimonials } = useQuery({
    queryKey: ["toolkit-main-testimonials"],
    queryFn: async () => {
      const res = await axios.get("/api/toolkit-main-testimonials");
      return res.data as {
        id: string;
        imageUrl: string;
        orderIndex: number;
      }[];
    },
  });

  const testimonialImages =
    fetchedTestimonials && fetchedTestimonials.length > 0
      ? fetchedTestimonials.map((item) => item.imageUrl)
      : images;
  return (
    <section
      className="
        relative
        left-1/2
        w-screen
        -translate-x-1/2
        overflow-hidden

        py-8

        xs:py-9

        sm:py-10

        md:py-12

        lg:py-14
      "
    >
      {/* TILTED DARK BACKGROUND */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[15%]
          z-0
          h-[85%]
          w-[120%]
          -translate-x-1/2

          bg-[#2d2b2b]
        "
      />

      {/* HEADING */}
      <div
        className="
          relative
          z-20
          mx-auto
          w-full
          min-h-[150px]
        "
      >
        

        {/* CENTERED HEADING */}
        <div
          className="
            mx-auto
            w-[88%]
            pt-20
            text-center

            sm:w-[80%]

            md:w-[70%]

            lg:w-[65%]
          "
        >
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <span className="text-sm text-orange-400 sm:text-base md:text-lg">
              ✦
            </span>

            <h2
              className="
                text-xl
                font-bold
                leading-[1.05]
                tracking-tight
                text-white

                sm:text-2xl

                md:text-5xl

                lg:text-[2.5rem]

                xl:text-[3rem]
              "
            >
              What students{" "}
              <span className="text-orange-500">
                feel about FTB
              </span>
            </h2>

            <span className="text-sm text-orange-400 sm:text-base md:text-lg">
              ✦
            </span>
          </div>

          <p
            className="
              mt-2
              text-xs
              leading-tight
              text-gray-400

              sm:text-sm

              md:text-base

              lg:text-lg
            "
          >
            Your not so non-chalant college companion🐧
          </p>
        </div>
      </div>

      {/* TESTIMONIAL STRIPS */}
      <div
        className="
          relative
          z-10
          mt-7

          sm:mt-8

          md:mt-9

          lg:mt-10

          xl:mt-11
        "
      >
        {/* TOP LAYER */}
        <TestimonialRow
          images={testimonialImages}
          secondRow={false}
        />

        {/* SECOND LAYER */}
        <TestimonialRow
          images={testimonialImages}
          reverse
          secondRow
        />
      </div>
    </section>
  );
}