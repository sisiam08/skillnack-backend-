import { prisma } from "../../lib/prisma";

const createReview = async (reviewData: {
  bookingId: string;
  rating: number;
  comment: string;
}) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.bookings.findUnique({
      where: { id: reviewData.bookingId },
      select: { tutorId: true },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    await tx.tutorProfiles.update({
      where: { id: booking.tutorId },
      data: {
        totalReviews: {
          increment: 1,
        },
        totalRating: {
          increment: reviewData.rating,
        },
      },
    });

    return await tx.reviews.create({
      data: { ...reviewData },
    });
  });
};

const getAllReviews = async () => {
  const data = await prisma.reviews.findMany({
    orderBy: {
      rating: "desc",
    },
    include: {
      booking: {
        select: {
          tutor: {
            select: {
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          student: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });
  return data.map((review: any) => ({
    id: review.id,
    bookingId: review.bookingId,
    rating: review.rating,
    comment: review.comment,
    tutorName: review.booking?.tutor?.user?.name,
    tutorImage: review.booking?.tutor?.user?.image,
    tutorCategory: review.booking?.tutor?.category?.name,
    studentName: review.booking?.student?.name,
    studentImage: review.booking?.student?.image,
  }));
};

const getAllReviewsForTutor = async (tutorId: string) => {
  const data = await prisma.reviews.findMany({
    where: { booking: { tutorId } },
    orderBy: {
      rating: "desc",
    },
    include: {
      booking: {
        select: {
          tutor: {
            select: {
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          student: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return data.map((review: any) => ({
    id: review.id,
    bookingId: review.bookingId,
    rating: review.rating,
    comment: review.comment,
    tutorName: review.booking?.tutor?.user?.name,
    tutorImage: review.booking?.tutor?.user?.image,
    tutorCategory: review.booking?.tutor?.category?.name,
    studentName: review.booking?.student?.name,
    studentImage: review.booking?.student?.image,
  }));
};

export const ReviewServices = {
  createReview,
  getAllReviews,
  getAllReviewsForTutor,
};
