// import React, { useEffect } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faCalendarDays,
//   faUsers,
//   faLocationDot,
//   faStar,
//   faEnvelope,
//   faPhone,
//   faArrowLeft,
//   faCheckCircle,
//   faClock,
//   faCreditCard,
//   faExclamationCircle
// } from "@fortawesome/free-solid-svg-icons";
// import DashboardLayout from "../Dashboard/DashboardLayout";
// import { getBookingDetailsAction, clearBookingError } from "../slices/bookingSlice";

// const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
// const formatDate = (value) => {
//   if (!value) return "";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "Invalid date";
//   return date.toLocaleDateString("en-IN", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// };

// const BookingDetail = () => {
//   const { bookingId } = useParams();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const { token } = useSelector((state) => state.auth);
//   const { booking, loading, error } = useSelector((state) => state.booking);

//   useEffect(() => {
//     if (!token) {
//       navigate("/login");
//       return;
//     }
//     if (bookingId) {
//       dispatch(getBookingDetailsAction(bookingId));
//     }
//     return () => {
//       dispatch(clearBookingError());
//     };
//   }, [dispatch, bookingId, token, navigate]);

//   if (loading) {
//     return (
//       <DashboardLayout>
//         <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
//           <div className="h-8 bg-slate-200 rounded-lg w-1/4 mb-4"></div>
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             <div className="lg:col-span-2 space-y-6">
//               <div className="h-64 bg-slate-200 rounded-2xl"></div>
//               <div className="h-64 bg-slate-200 rounded-2xl"></div>
//             </div>
//             <div className="h-96 bg-slate-200 rounded-2xl"></div>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (error) {
//     return (
//       <DashboardLayout>
//         <div className="py-16 text-center max-w-xl mx-auto space-y-4">
//           <div className="text-5xl text-rose-500">
//             <FontAwesomeIcon icon={faExclamationCircle} />
//           </div>
//           <h2 className="text-2xl font-bold text-slate-800">Error Loading Booking</h2>
//           <p className="text-slate-600">{error}</p>
//           <Link
//             to="/dashboard/bookings"
//             className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-6 py-2.5 font-bold text-white shadow hover:bg-slate-900 transition"
//           >
//             <FontAwesomeIcon icon={faArrowLeft} />
//             Back to Bookings
//           </Link>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (!booking) {
//     return (
//       <DashboardLayout>
//         <div className="py-16 text-center max-w-xl mx-auto space-y-4">
//           <div className="text-5xl text-slate-400">🔍</div>
//           <h2 className="text-2xl font-bold text-slate-800">Booking Not Found</h2>
//           <p className="text-slate-600">The booking details you are looking for do not exist or have been removed.</p>
//           <Link
//             to="/dashboard/bookings"
//             className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-6 py-2.5 font-bold text-white shadow hover:bg-slate-900 transition"
//           >
//             <FontAwesomeIcon icon={faArrowLeft} />
//             Back to Bookings
//           </Link>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   const {
//     guide,
//     tourist,
//     post,
//     customPackageId,
//     startDate,
//     endDate,
//     tourDate,
//     numberOfPeople,
//     specialRequests,
//     totalPrice,
//     depositAmount,
//     finalAmount,
//     paymentStatus,
//     status,
//     createdAt,
//   } = booking;

//   // Resolve guide details
//   const guideName = guide?.name || "Unassigned Guide";
//   const guideEmail = guide?.email || "";
//   const guidePhone = guide?.phone || "";
//   const guideAvatar = guide?.avatar || "default_avatar.jpg";
//   const guideRating = guide?.averageRating || 0;
//   const guideLanguages = Array.isArray(guide?.languages) ? guide.languages : [];

//   // Date range
//   const startDay = startDate || tourDate;
//   const endDay = endDate || tourDate;

//   // Custom package assets if they exist
//   const customPackage = customPackageId || null;
//   const assetsSelected = customPackage?.selectedAssets || [];

//   // Resolve pricing details for custom packages to prevent incorrect breakdown displays
//   const days =
//     startDay && endDay
//       ? Math.max(
//           1,
//           Math.round((new Date(endDay) - new Date(startDay)) / (1000 * 60 * 60 * 24)) + 1
//         )
//       : 1;
//   const baseGuideFeeTotal = customPackage
//     ? (customPackage.basePrice * numberOfPeople * days)
//     : (Number(post?.price || 0) * numberOfPeople * days);
  
//   const rentalAssetsTotal = customPackage
//     ? customPackage.selectedAssets?.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
//     : 0;

//   const groupDiscountAmount = customPackage
//     ? Math.round(baseGuideFeeTotal * ((customPackage.groupDiscount || 0) / 100))
//     : 0;

//   // Milestone payment logic
//   const isDepositPaid = paymentStatus === "deposit_paid" || paymentStatus === "final_pending" || paymentStatus === "fully_paid";
//   const isFinalPaid = paymentStatus === "fully_paid";

//   return (
//     <DashboardLayout>
//       <div className="space-y-8 max-w-7xl mx-auto pb-12">
//         {/* HEADER BAR */}
//         <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
//           <div className="space-y-3">
//             <Link 
//               to="/dashboard/bookings" 
//               className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs transition-all hover:-translate-x-0.5 duration-200"
//             >
//               <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
//               Back to Bookings
//             </Link>
//             <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
//               Booking Details
//             </h1>
//             <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
//               <span>Booking ID:</span>
//               <span className="font-mono bg-slate-200/70 text-slate-800 px-2 py-0.5 rounded text-xs font-bold">
//                 #{String(booking._id).slice(-6).toUpperCase()}
//               </span>
//               <span className="text-slate-300">•</span>
//               <span>Created {formatDate(createdAt)}</span>
//             </p>
//           </div>

//           <div className="flex flex-wrap items-center gap-3">
//             {/* Status Badge */}
//             <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-2xs ring-1 ring-inset ${
//               status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
//               status === 'completed' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' :
//               status === 'cancelled' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' :
//               'bg-amber-50 text-amber-700 ring-amber-600/20'
//             }`}>
//               <span className={`h-1.5 w-1.5 rounded-full ${
//                 status === 'confirmed' ? 'bg-emerald-500' :
//                 status === 'completed' ? 'bg-indigo-500' :
//                 status === 'cancelled' ? 'bg-rose-500' :
//                 'bg-amber-500'
//               }`} />
//               {status?.toUpperCase()}
//             </span>

//             {/* Payment Status Badge */}
//             <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-2xs ring-1 ring-inset ${
//               paymentStatus === 'fully_paid' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
//               paymentStatus === 'deposit_paid' || paymentStatus === 'final_pending' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
//               paymentStatus === 'deposit_pending' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
//               'bg-slate-100 text-slate-700 ring-slate-600/20'
//             }`}>
//               <span className={`h-1.5 w-1.5 rounded-full ${
//                 paymentStatus === 'fully_paid' ? 'bg-emerald-500' :
//                 paymentStatus === 'deposit_paid' || paymentStatus === 'final_pending' ? 'bg-blue-500' :
//                 paymentStatus === 'deposit_pending' ? 'bg-amber-500' :
//                 'bg-slate-500'
//               }`} />
//               {paymentStatus?.replace("_", " ")?.toUpperCase()}
//             </span>
//           </div>
//         </div>

//         {/* DETAILS LAYOUT */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* LEFT: TRIP INFO & GUIDE INFO */}
//           <div className="lg:col-span-2 space-y-8">
//             {/* TRIP DETAILS CARD */}
//             <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xs border border-slate-100 hover:shadow-md transition duration-300 space-y-6">
//               <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
//                   <FontAwesomeIcon icon={faLocationDot} className="text-lg" />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-bold text-slate-900">Trip Overview</h2>
//                   <p className="text-xs text-slate-500">Destination, schedule & group size</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
//                 <div className="pb-3 border-b border-slate-100">
//                   <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tour Destination</span>
//                   <p className="text-base font-bold text-slate-800">{post?.title || "Custom Package Tour"}</p>
//                 </div>
//                 <div className="pb-3 border-b border-slate-100">
//                   <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Group Size</span>
//                   <p className="text-base font-bold text-slate-800 flex items-center gap-2">
//                     <FontAwesomeIcon icon={faUsers} className="text-slate-400 text-sm" />
//                     {numberOfPeople} {numberOfPeople === 1 ? "Person" : "People"}
//                   </p>
//                 </div>
//                 <div className="pb-3 border-b border-slate-100">
//                   <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Start Date</span>
//                   <p className="text-base font-bold text-slate-800 flex items-center gap-2">
//                     <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400 text-sm" />
//                     {formatDate(startDay)}
//                   </p>
//                 </div>
//                 <div className="pb-3 border-b border-slate-100">
//                   <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">End Date</span>
//                   <p className="text-base font-bold text-slate-800 flex items-center gap-2">
//                     <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400 text-sm" />
//                     {formatDate(endDay)}
//                   </p>
//                 </div>
//               </div>

//               {specialRequests && (
//                 <div className="pt-4 border-t border-slate-100 space-y-2">
//                   <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Special Requests</span>
//                   <div className="text-sm text-slate-700 bg-amber-50/50 p-4 rounded-xl border border-amber-200/50 leading-relaxed font-semibold">
//                     {specialRequests}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* GUIDE PROFILE DETAILS CARD */}
//             <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xs border border-slate-100 hover:shadow-md transition duration-300 space-y-6">
//               <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
//                   <FontAwesomeIcon icon={faUsers} className="text-lg" />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-bold text-slate-900">Your Guide</h2>
//                   <p className="text-xs text-slate-500">Contact details and profile info</p>
//                 </div>
//               </div>

//               <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-2xl bg-slate-50/80 border border-slate-100">
//                 <div className="relative h-24 w-24 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-md ring-2 ring-blue-100 flex items-center justify-center">
//                   <img
//                     src={guideAvatar === "default_avatar.jpg" ? "/default_profile.jpg" : guideAvatar}
//                     alt={guideName}
//                     className="h-24 w-24 rounded-full object-cover"
//                     style={{ objectFit: "cover", width: "96px", height: "96px" }}
//                   />
//                 </div>
//                 <div className="flex-1 text-center sm:text-left space-y-3">
//                   <div>
//                     <h3 className="text-xl font-extrabold text-slate-800 capitalize leading-snug">{guideName}</h3>
//                     <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
//                       <FontAwesomeIcon icon={faStar} className="text-amber-400 text-sm" />
//                       <span className="font-bold text-slate-800 text-sm">{guideRating.toFixed(1)}</span>
//                       <span className="text-slate-300 text-xs">/</span>
//                       <span className="text-slate-500 text-xs">5.0</span>
//                     </div>
//                   </div>

//                   <div className="flex flex-wrap justify-center sm:justify-start gap-3">
//                     {guidePhone && (
//                       <a 
//                         href={`tel:${guidePhone}`} 
//                         className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 border border-slate-200 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition"
//                       >
//                         <FontAwesomeIcon icon={faPhone} className="text-slate-400 text-[10px]" />
//                         {guidePhone}
//                       </a>
//                     )}
//                     {guideEmail && (
//                       <a 
//                         href={`mailto:${guideEmail}`} 
//                         className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 border border-slate-200 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition"
//                       >
//                         <FontAwesomeIcon icon={faEnvelope} className="text-slate-400 text-[10px]" />
//                         {guideEmail}
//                       </a>
//                     )}
//                   </div>

//                   {guideLanguages.length > 0 && (
//                     <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
//                       {guideLanguages.map((lang, index) => (
//                         <span key={index} className="bg-slate-200/60 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
//                           {lang}
//                         </span>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* CUSTOM SELECTED ASSETS CARD */}
//             {assetsSelected.length > 0 && (
//               <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xs border border-slate-100 hover:shadow-md transition duration-300 space-y-6">
//                 <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
//                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
//                     <FontAwesomeIcon icon={faLocationDot} className="text-lg" />
//                   </div>
//                   <div>
//                     <h2 className="text-xl font-bold text-slate-900">Selected Rental Assets</h2>
//                     <p className="text-xs text-slate-500">Gear and equipment included in your package</p>
//                   </div>
//                 </div>

//                 <div className="overflow-hidden rounded-xl border border-slate-100 shadow-2xs">
//                   <table className="w-full text-left text-sm border-collapse">
//                     <thead>
//                       <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
//                         <th className="py-3 px-4">Asset</th>
//                         <th className="py-3 px-4">Type</th>
//                         <th className="py-3 px-4 text-center">Quantity</th>
//                         <th className="py-3 px-4 text-right">Price/Day</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-100">
//                       {assetsSelected.map((item, idx) => (
//                         <tr key={idx} className="hover:bg-slate-50/40 transition">
//                           <td className="py-3.5 px-4 font-semibold text-slate-800">
//                             {item.assetId?.name || "Rental Asset"}
//                           </td>
//                           <td className="py-3.5 px-4 capitalize text-slate-500 font-medium">
//                             {item.assetId?.type || "Other"}
//                           </td>
//                           <td className="py-3.5 px-4 text-center text-slate-800 font-bold">
//                             {item.quantity}
//                           </td>
//                           <td className="py-3.5 px-4 text-right text-slate-800 font-semibold">
//                             {money(item.pricePerDay || item.assetId?.pricePerDay)}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* RIGHT: COST BREAKDOWN & PAYMENTS ACTIONS */}
//           <div className="space-y-8">
//             {/* PRICING BREAKDOWN CARD */}
//             <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xs border border-slate-100 hover:shadow-md transition duration-300 space-y-6 lg:sticky lg:top-8">
//               <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
//                   <FontAwesomeIcon icon={faCreditCard} className="text-base" />
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-bold text-slate-900">Price Breakdown</h2>
//                   <p className="text-xs text-slate-500">Summary of guide and asset costs</p>
//                 </div>
//               </div>
              
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center py-2 text-sm">
//                   <span className="text-slate-500 font-medium">Base Guide Fee</span>
//                   <span className="font-semibold text-slate-800">
//                     {money(baseGuideFeeTotal)}
//                   </span>
//                 </div>

//                 {customPackage && (
//                   <div className="flex justify-between items-center py-2 text-sm border-t border-slate-100/60 pt-2">
//                     <span className="text-slate-500 font-medium">Rental Assets</span>
//                     <span className="font-semibold text-slate-800">{money(rentalAssetsTotal)}</span>
//                   </div>
//                 )}

//                 {customPackage && Number(customPackage.groupDiscount || 0) > 0 && (
//                   <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">
//                     <span className="font-semibold flex items-center gap-1.5">
//                       <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 text-xs" />
//                       Group Discount ({customPackage.groupDiscount}%)
//                     </span>
//                     <span className="font-bold">-{money(groupDiscountAmount)}</span>
//                   </div>
//                 )}

//                 <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-2">
//                   <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">Total Cost</span>
//                   <span className="text-2xl font-extrabold text-blue-600">{money(totalPrice)}</span>
//                 </div>
//               </div>
//             </div>

//             {/* PAYMENT SUMMARY CARD */}
//             <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xs border border-slate-100 hover:shadow-md transition duration-300 space-y-6">
//               <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
//                   <FontAwesomeIcon icon={faCreditCard} className="text-base" />
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-bold text-slate-900">Payment Status</h2>
//                   <p className="text-xs text-slate-500">Timeline and breakdown of payments</p>
//                 </div>
//               </div>
              
//               {/* Payment Timeline Stepper */}
//               <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
//                 {/* Milestone 1: Deposit */}
//                 <div className="relative">
//                   {/* Indicator Dot */}
//                   <span className={`absolute left-[4px] top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 ${
//                     isDepositPaid 
//                       ? "bg-emerald-500 border-emerald-500 text-white" 
//                       : "bg-white border-amber-400 text-amber-500"
//                   }`}>
//                     {isDepositPaid ? (
//                       <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
//                     ) : (
//                       <FontAwesomeIcon icon={faClock} className="text-[10px]" />
//                     )}
//                   </span>
//                   <div className="pl-2">
//                     <div className="flex items-center justify-between">
//                       <h4 className="text-sm font-bold text-slate-800">Deposit Amount (20%)</h4>
//                       <span className="font-mono font-bold text-slate-800">{money(depositAmount)}</span>
//                     </div>
//                     <p className="text-xs text-slate-500 mt-0.5">
//                       {isDepositPaid ? "Paid successfully" : "Awaiting payment"}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Milestone 2: Final Settlement */}
//                 <div className="relative">
//                   {/* Indicator Dot */}
//                   <span className={`absolute left-[4px] top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 ${
//                     isFinalPaid 
//                       ? "bg-emerald-500 border-emerald-500 text-white" 
//                       : "bg-white border-slate-200 text-slate-400"
//                   }`}>
//                     {isFinalPaid ? (
//                       <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
//                     ) : (
//                       <FontAwesomeIcon icon={faClock} className="text-[10px]" />
//                     )}
//                   </span>
//                   <div className="pl-2">
//                     <div className="flex items-center justify-between">
//                       <h4 className="text-sm font-bold text-slate-800">Final Settlement (80%)</h4>
//                       <span className="font-mono font-bold text-slate-800">{money(finalAmount)}</span>
//                     </div>
//                     <p className="text-xs text-slate-500 mt-0.5">
//                       {isFinalPaid ? "Paid successfully" : "Awaiting final settlement"}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* ACTION BUTTONS & SUCCESS STATUS */}
//               {paymentStatus === "fully_paid" ? (
//                 <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4 text-center">
//                   <p className="text-emerald-800 text-sm font-semibold flex items-center justify-center gap-2">
//                     <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 text-base" />
//                     Payment Complete
//                   </p>
//                 </div>
//               ) : (
//                 <div className="pt-2 border-t border-slate-100">
//                   <Link
//                     to={`/dashboard/payment?bookingId=${booking._id}`}
//                     className="w-full flex items-center justify-center gap-2 text-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3.5 text-sm font-bold text-white shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition duration-200"
//                   >
//                     <FontAwesomeIcon icon={faCreditCard} />
//                     Proceed to Pay {paymentStatus === "deposit_pending" ? "Deposit" : "Final Balance"}
//                   </Link>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default BookingDetail;



//////////////////////////////
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import AssetSelector from "../components/custom-package/AssetSelector";
import { getGuideAssets, estimateAddon, createAddonOrder, verifyAddonPayment } from "../services/api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faUsers,
  faLocationDot,
  faStar,
  faEnvelope,
  faPhone,
  faArrowLeft,
  faCheckCircle,
  faClock,
  faCreditCard,
  faExclamationCircle,
  faTimesCircle
} from "@fortawesome/free-solid-svg-icons";
import DashboardLayout from "../Dashboard/DashboardLayout";
import { getBookingDetailsAction, clearBookingError } from "../slices/bookingSlice";
import "./BookingDetail.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const BookingDetail = () => {
  const { bookingId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { token, user } = useSelector((state) => state.auth);
  const { booking, loading, error } = useSelector((state) => state.booking);

  const isTourist = user?.role === "tourist";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState({});
  const [additionalCost, setAdditionalCost] = useState(0);
  const [estimateError, setEstimateError] = useState("");
  const [processingAddon, setProcessingAddon] = useState(false);

  useEffect(() => {
    if (isModalOpen && booking?.guide?._id) {
      const fetchAssets = async () => {
        try {
          const res = await getGuideAssets(booking.guide._id);
          setAvailableAssets(res.assets || []);
        } catch (err) {
          console.error("Failed to load assets:", err);
          toast.error("Failed to load guide assets.");
        }
      };
      fetchAssets();
    }
  }, [isModalOpen, booking?.guide?._id]);

  useEffect(() => {
    const items = Object.values(selectedAssets);
    if (items.length === 0) {
      setAdditionalCost(0);
      setEstimateError("");
      return;
    }

    const fetchEstimate = async () => {
      try {
        const payload = {
          items: items.map(item => ({
            assetId: item.assetId,
            quantity: item.quantity
          }))
        };
        const data = await estimateAddon(booking._id, payload);
        setAdditionalCost(data.amount || 0);
        setEstimateError("");
      } catch (err) {
        console.error(err);
        setEstimateError(err.message || "Failed to calculate estimate");
      }
    };

    const timer = setTimeout(fetchEstimate, 300);
    return () => clearTimeout(timer);
  }, [selectedAssets, booking?._id]);

  const handleAddAsset = (asset) => {
    setSelectedAssets((current) => ({
      ...current,
      [asset._id]: {
        assetId: asset._id,
        name: asset.name,
        type: asset.type || asset.category || "other",
        pricePerDay: Number(asset.pricePerDay || asset.price || 0),
        quantity: 1,
      },
    }));
  };

  const handleRemoveAsset = (assetId) => {
    setSelectedAssets((current) => {
      const next = { ...current };
      delete next[assetId];
      return next;
    });
  };

  const handleQuantityChange = (assetId, quantity) => {
    setSelectedAssets((current) => ({
      ...current,
      [assetId]: { ...current[assetId], quantity: Number(quantity) },
    }));
  };

  const handleConfirmAddon = async () => {
    const items = Object.values(selectedAssets);
    if (items.length === 0) return;

    setProcessingAddon(true);
    try {
      const payload = {
        items: items.map(item => ({
          assetId: item.assetId,
          quantity: item.quantity
        }))
      };

      const orderData = await createAddonOrder(booking._id, payload);

      if (orderData?.orderId) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          const options = {
            key: orderData.key || "rzp_test_YOUR_KEY_HERE",
            amount: orderData.amount,
            currency: orderData.currency || "INR",
            name: "GullyGuide",
            description: "Payment for Extra Rental Items",
            order_id: orderData.orderId,
            handler: async (response) => {
              try {
                await verifyAddonPayment(booking._id, {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                });

                const successAudio = new Audio("/sounds/mixkit-kids-cartoon-close-bells-2256.wav");
                successAudio.play().catch(e => console.error("Error playing success sound", e));

                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 }
                });

                toast.success("Item(s) added successfully!");
                setIsModalOpen(false);
                setSelectedAssets({});

                dispatch(getBookingDetailsAction(booking._id));
              } catch (err) {
                console.error(err);
                const errorAudio = new Audio("/sounds/error-remove.wav");
                errorAudio.play().catch(e => console.error("Error playing error sound", e));
                toast.error(err.message || "Payment verification failed. Please try again.");
              }
            },
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
              contact: user?.phone || "",
            },
            theme: {
              color: "#3B82F6",
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
          rzp.on("payment.failed", (response) => {
            const errorAudio = new Audio("/sounds/error-remove.wav");
            errorAudio.play().catch(e => console.error("Error playing error sound", e));
            toast.error(`Payment failed: ${response.error.description}`);
          });
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error(err);
      const errorAudio = new Audio("/sounds/error-remove.wav");
      errorAudio.play().catch(e => console.error("Error playing error sound", e));
      toast.error(err.message || "Failed to initiate add-on payment. Please try again.");
    } finally {
      setProcessingAddon(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (bookingId) {
      dispatch(getBookingDetailsAction(bookingId));
    }
    return () => {
      dispatch(clearBookingError());
    };
  }, [dispatch, bookingId, token, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="bd-skeleton-wrapper">
          <div className="bd-skeleton-title"></div>
          <div className="bd-skeleton-grid">
            <div className="bd-skeleton-col">
              <div className="bd-skeleton-box bd-skeleton-box-lg"></div>
              <div className="bd-skeleton-box bd-skeleton-box-lg"></div>
            </div>
            <div className="bd-skeleton-box bd-skeleton-box-xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bd-status-wrapper">
          <div className="bd-status-icon bd-status-icon-error">
            <FontAwesomeIcon icon={faExclamationCircle} />
          </div>
          <h2 className="bd-status-title">Error Loading Booking</h2>
          <p className="bd-status-text">{error}</p>
          <Link to="/dashboard/bookings" className="bd-back-btn">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Bookings
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="bd-status-wrapper">
          <div className="bd-status-icon bd-status-icon-muted">🔍</div>
          <h2 className="bd-status-title">Booking Not Found</h2>
          <p className="bd-status-text">The booking details you are looking for do not exist or have been removed.</p>
          <Link to="/dashboard/bookings" className="bd-back-btn">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Bookings
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const {
    guide,
    tourist,
    post,
    customPackageId,
    startDate,
    endDate,
    tourDate,
    numberOfPeople,
    specialRequests,
    totalPrice,
    depositAmount,
    finalAmount,
    paymentStatus,
    status,
    createdAt,
  } = booking;

  // Resolve guide details
  const guideName = guide?.name || "Unassigned Guide";
  const guideEmail = guide?.email || "";
  const guidePhone = guide?.phone || "";
  const guideAvatar = guide?.avatar || "default_avatar.jpg";
  const guideRating = guide?.averageRating || 0;
  const guideLanguages = Array.isArray(guide?.languages) ? guide.languages : [];

  // Date range
  const startDay = startDate || tourDate;
  const endDay = endDate || tourDate;

  // Custom package assets combined with booking level add-ons
  const customPackage = customPackageId || null;
  const assetsSelected = [
    ...(customPackage?.selectedAssets || []),
    ...(booking?.selectedAssets || [])
  ];

  // Resolve pricing details for custom packages to prevent incorrect breakdown displays
  const days =
    startDay && endDay
      ? Math.max(
          1,
          Math.round((new Date(endDay) - new Date(startDay)) / (1000 * 60 * 60 * 24)) + 1
        )
      : 1;
  const baseGuideFeeTotal = customPackage
    ? (customPackage.basePrice * numberOfPeople * days)
    : (Number(post?.price || 0) * numberOfPeople * days);

  const customAssetsTotal = customPackage
    ? customPackage.selectedAssets?.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    : 0;
  const addonAssetsTotal = booking?.selectedAssets
    ? booking.selectedAssets.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    : 0;
  const rentalAssetsTotal = customAssetsTotal + addonAssetsTotal;

  const groupDiscountAmount = customPackage
    ? Math.round(baseGuideFeeTotal * ((customPackage.groupDiscount || 0) / 100))
    : 0;

  // Milestone payment logic
  const isDepositPaid = paymentStatus === "deposit_paid" || paymentStatus === "final_pending" || paymentStatus === "fully_paid";
  const isFinalPaid = paymentStatus === "fully_paid";

  const displayDepositAmount = depositAmount || Math.round(totalPrice * 0.2);
  const displayFinalAmount = finalAmount || Math.round(totalPrice * 0.8);

  const statusClass =
    status === "confirmed" ? "bd-status-confirmed" :
    status === "completed" ? "bd-status-completed" :
    status === "cancelled" ? "bd-status-cancelled" :
    "bd-status-pending";

  const paymentBadgeClass =
    paymentStatus === "fully_paid" ? "bd-status-confirmed" :
    (paymentStatus === "deposit_paid" || paymentStatus === "final_pending") ? "bd-status-info" :
    paymentStatus === "deposit_pending" ? "bd-status-pending" :
    "bd-status-neutral";

  return (
    <DashboardLayout>
      <div className="bd-page">
        {/* HEADER BAR */}
        <div className="bd-header-bar">
          <div className="bd-header-left">
            <Link to="/dashboard/bookings" className="bd-back-link">
              <FontAwesomeIcon icon={faArrowLeft} className="bd-back-link-icon" />
              Back to Bookings
            </Link>
            <h1 className="bd-page-title">Booking Details</h1>
            <p className="bd-page-meta">
              <span>Booking ID:</span>
              <span className="bd-id-badge">
                #{String(booking._id).slice(-6).toUpperCase()}
              </span>
              <span className="bd-meta-separator">•</span>
              <span>Created {formatDate(createdAt)}</span>
            </p>
          </div>

          <div className="bd-badge-group">
            <span className={`bd-badge ${statusClass}`}>
              <span className="bd-badge-dot" />
              {status?.toUpperCase()}
            </span>

            <span className={`bd-badge ${paymentBadgeClass}`}>
              <span className="bd-badge-dot" />
              {paymentStatus?.replace("_", " ")?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* DETAILS LAYOUT */}
        <div className="bd-layout">
          {/* LEFT: TRIP INFO & GUIDE INFO */}
          <div className="bd-left-col">
            {/* CANCELLATION DETAILS CARD */}
            {status === "cancelled" && (
              <div className="bd-card" style={{ borderColor: "#fda4af" }}>
                <div className="bd-card-header">
                  <div className="bd-card-icon" style={{ backgroundColor: "#ffe4e6", color: "#e11d48" }}>
                    <FontAwesomeIcon icon={faTimesCircle} />
                  </div>
                  <div>
                    <h2 className="bd-card-title" style={{ color: "#be123c" }}>Cancellation Details</h2>
                    <p className="bd-card-subtitle">Information regarding the cancelled trip</p>
                  </div>
                </div>

                <div className="bd-info-grid">
                  <div className="bd-info-item">
                    <span className="bd-info-label">Cancellation Reason</span>
                    <p className="bd-info-value" style={{ color: "#be123c", fontWeight: "bold" }}>
                      {booking.cancellationReason || "No reason provided"}
                    </p>
                  </div>
                  <div className="bd-info-item">
                    <span className="bd-info-label">Cancellation Date</span>
                    <p className="bd-info-value">
                      {booking.cancelledAt ? formatDate(booking.cancelledAt) : formatDate(booking.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* REFUND STATUS CARD */}
            {booking.refundStatus && booking.refundStatus !== "not_applicable" && (
              <div className="bd-card" style={{ borderColor: booking.refundStatus === "completed" ? "#a7f3d0" : "#fde68a" }}>
                <div className="bd-card-header">
                  <div className="bd-card-icon bd-card-icon-indigo">
                    <FontAwesomeIcon icon={faCreditCard} />
                  </div>
                  <div>
                    <h2 className="bd-card-title">Refund Status</h2>
                    <p className="bd-card-subtitle">Tracking of your payment reversal</p>
                  </div>
                </div>

                <div className="bd-info-grid">
                  <div className="bd-info-item">
                    <span className="bd-info-label">Amount Being Refunded</span>
                    <p className="bd-info-value font-bold text-slate-800" style={{ fontWeight: "bold" }}>
                      {money(booking.refundAmount)}
                    </p>
                  </div>
                  <div className="bd-info-item">
                    <span className="bd-info-label">Current Status</span>
                    <span 
                      className={`bd-badge ${
                        booking.refundStatus === "pending" ? "bd-status-pending" :
                        booking.refundStatus === "processing" ? "bd-status-info" :
                        booking.refundStatus === "completed" ? "bd-status-confirmed" :
                        "bd-status-cancelled"
                      }`}
                      style={{ display: "inline-flex", marginTop: "4px", width: "fit-content" }}
                    >
                      <span className="bd-badge-dot" />
                      {booking.refundStatus === "pending" ? "Refund Initiated" :
                       booking.refundStatus === "processing" ? "Processing — usually takes 5-7 business days" :
                       booking.refundStatus === "completed" ? "Refund Completed" :
                       booking.refundStatus === "failed" ? "Refund Failed" :
                       booking.refundStatus.toUpperCase()}
                    </span>
                  </div>
                  {booking.refundInitiatedAt && (
                    <div className="bd-info-item">
                      <span className="bd-info-label">Refund Initiated On</span>
                      <p className="bd-info-value">{formatDate(booking.refundInitiatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TRIP DETAILS CARD */}
            <div className="bd-card">
              <div className="bd-card-header">
                <div className="bd-card-icon bd-card-icon-blue">
                  <FontAwesomeIcon icon={faLocationDot} />
                </div>
                <div>
                  <h2 className="bd-card-title">Trip Overview</h2>
                  <p className="bd-card-subtitle">Destination, schedule & group size</p>
                </div>
              </div>

              <div className="bd-info-grid">
                <div className="bd-info-item">
                  <span className="bd-info-label">Tour Destination</span>
                  <p className="bd-info-value">{post?.title || "Custom Package Tour"}</p>
                </div>
                <div className="bd-info-item">
                  <span className="bd-info-label">Group Size</span>
                  <p className="bd-info-value bd-info-value-icon">
                    <FontAwesomeIcon icon={faUsers} className="bd-info-icon" />
                    {numberOfPeople} {numberOfPeople === 1 ? "Person" : "People"}
                  </p>
                </div>
                <div className="bd-info-item">
                  <span className="bd-info-label">Start Date</span>
                  <p className="bd-info-value bd-info-value-icon">
                    <FontAwesomeIcon icon={faCalendarDays} className="bd-info-icon" />
                    {formatDate(startDay)}
                  </p>
                </div>
                <div className="bd-info-item">
                  <span className="bd-info-label">End Date</span>
                  <p className="bd-info-value bd-info-value-icon">
                    <FontAwesomeIcon icon={faCalendarDays} className="bd-info-icon" />
                    {formatDate(endDay)}
                  </p>
                </div>
              </div>

              {specialRequests && (
                <div className="bd-special-requests">
                  <span className="bd-info-label">Special Requests</span>
                  <div className="bd-special-requests-box">
                    {specialRequests}
                  </div>
                </div>
              )}
            </div>

            {/* GUIDE PROFILE DETAILS CARD */}
            <div className="bd-card">
              <div className="bd-card-header">
                <div className="bd-card-icon bd-card-icon-blue">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <div>
                  <h2 className="bd-card-title">Your Guide</h2>
                  <p className="bd-card-subtitle">Contact details and profile info</p>
                </div>
              </div>

              <div className="bd-guide-body">
                <div className="bd-guide-avatar-wrap">
                  <img
                    src={guideAvatar === "default_avatar.jpg" ? "/default_profile.jpg" : guideAvatar}
                    alt={guideName}
                    className="bd-guide-avatar"
                  />
                </div>
                <div className="bd-guide-info">
                  <div>
                    <h3 className="bd-guide-name">{guideName}</h3>
                    <div className="bd-guide-rating">
                      <FontAwesomeIcon icon={faStar} className="bd-star-icon" />
                      <span className="bd-rating-value">{guideRating.toFixed(1)}</span>
                      <span className="bd-rating-slash">/</span>
                      <span className="bd-rating-max">5.0</span>
                    </div>
                  </div>

                  <div className="bd-guide-contacts">
                    {guidePhone && (
                      <a href={`tel:${guidePhone}`} className="bd-contact-pill">
                        <FontAwesomeIcon icon={faPhone} className="bd-contact-icon" />
                        {guidePhone}
                      </a>
                    )}
                    {guideEmail && (
                      <a href={`mailto:${guideEmail}`} className="bd-contact-pill">
                        <FontAwesomeIcon icon={faEnvelope} className="bd-contact-icon" />
                        {guideEmail}
                      </a>
                    )}
                  </div>

                  {guideLanguages.length > 0 && (
                    <div className="bd-language-tags">
                      {guideLanguages.map((lang, index) => (
                        <span key={index} className="bd-language-tag">
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CUSTOM SELECTED ASSETS CARD */}
            {assetsSelected.length > 0 ? (
              <div className="bd-card">
                <div className="bd-card-header">
                  <div className="bd-card-icon bd-card-icon-blue">
                    <FontAwesomeIcon icon={faLocationDot} />
                  </div>
                  <div>
                    <h2 className="bd-card-title">Selected Rental Assets</h2>
                    <p className="bd-card-subtitle">Gear and equipment included in your package</p>
                  </div>
                </div>

                <div className="bd-table-wrap">
                  <table className="bd-table">
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Type</th>
                        <th className="bd-col-center">Quantity</th>
                        <th className="bd-col-right">Price/Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetsSelected.map((item, idx) => (
                        <tr key={idx}>
                          <td className="bd-td-strong">{item.assetId?.name || "Rental Asset"}</td>
                          <td className="bd-td-muted">{item.assetId?.type || "Other"}</td>
                          <td className="bd-col-center bd-td-strong">{item.quantity}</td>
                          <td className="bd-col-right bd-td-strong">
                            {money(item.pricePerDay || item.assetId?.pricePerDay)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isTourist && status !== "cancelled" && status !== "completed" && (
                  <button
                    type="button"
                    className="bd-addon-trigger-btn"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <i className="fa-solid fa-plus" /> Add More Items
                  </button>
                )}
              </div>
            ) : (
              isTourist && status !== "cancelled" && status !== "completed" && (
                <div className="bd-card">
                  <div className="bd-card-header">
                    <div className="bd-card-icon bd-card-icon-blue">
                      <FontAwesomeIcon icon={faLocationDot} />
                    </div>
                    <div>
                      <h2 className="bd-card-title">Trip Rentals & Gear</h2>
                      <p className="bd-card-subtitle">No gear or rentals added to this booking yet</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bd-addon-trigger-btn"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <i className="fa-solid fa-plus" /> Add Trip Gear & Rentals
                  </button>
                </div>
              )
            )}
          </div>

          {/* RIGHT: COST BREAKDOWN & PAYMENTS ACTIONS */}
          <div className="bd-right-col">
            {/* PRICING BREAKDOWN CARD */}
            <div className="bd-card bd-card-sticky">
              <div className="bd-card-header">
                <div className="bd-card-icon bd-card-icon-indigo">
                  <FontAwesomeIcon icon={faCreditCard} />
                </div>
                <div>
                  <h2 className="bd-card-title bd-card-title-sm">Price Breakdown</h2>
                  <p className="bd-card-subtitle">Summary of guide and asset costs</p>
                </div>
              </div>

              <div className="bd-price-list">
                <div className="bd-price-row">
                  <span className="bd-price-label">Base Guide Fee</span>
                  <span className="bd-price-value">{money(baseGuideFeeTotal)}</span>
                </div>

                {(customPackage || (booking.selectedAssets && booking.selectedAssets.length > 0)) && (
                  <div className="bd-price-row bd-price-row-border">
                    <span className="bd-price-label">Rental Assets</span>
                    <span className="bd-price-value">{money(rentalAssetsTotal)}</span>
                  </div>
                )}

                {customPackage && Number(customPackage.groupDiscount || 0) > 0 && (
                  <div className="bd-discount-row">
                    <span className="bd-discount-label">
                      <FontAwesomeIcon icon={faCheckCircle} className="bd-discount-icon" />
                      Group Discount ({customPackage.groupDiscount}%)
                    </span>
                    <span className="bd-discount-value">-{money(groupDiscountAmount)}</span>
                  </div>
                )}

                <div className="bd-total-row">
                  <span className="bd-total-label">Total Cost</span>
                  <span className="bd-total-value">{money(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* PAYMENT SUMMARY CARD */}
            <div className="bd-card">
              <div className="bd-card-header">
                <div className="bd-card-icon bd-card-icon-blue">
                  <FontAwesomeIcon icon={faCreditCard} />
                </div>
                <div>
                  <h2 className="bd-card-title bd-card-title-sm">Payment Status</h2>
                  <p className="bd-card-subtitle">Timeline and breakdown of payments</p>
                </div>
              </div>

              {/* Payment Timeline Stepper */}
              <div className="bd-timeline">
                {/* Milestone 1: Deposit */}
                <div className="bd-timeline-item">
                  <span className={`bd-timeline-dot ${isDepositPaid ? "bd-dot-paid" : "bd-dot-pending"}`}>
                    <FontAwesomeIcon icon={isDepositPaid ? faCheckCircle : faClock} />
                  </span>
                  <div className="bd-timeline-content">
                    <div className="bd-timeline-row">
                      <h4 className="bd-timeline-title">Deposit Amount (20%)</h4>
                      <span className="bd-timeline-amount">{money(displayDepositAmount)}</span>
                    </div>
                    <p className="bd-timeline-status">
                      {isDepositPaid ? "Paid successfully" : "Awaiting payment"}
                    </p>
                  </div>
                </div>

                {/* Milestone 2: Final Settlement */}
                <div className="bd-timeline-item">
                  <span className={`bd-timeline-dot ${isFinalPaid ? "bd-dot-paid" : "bd-dot-neutral"}`}>
                    <FontAwesomeIcon icon={isFinalPaid ? faCheckCircle : faClock} />
                  </span>
                  <div className="bd-timeline-content">
                    <div className="bd-timeline-row">
                      <h4 className="bd-timeline-title">Final Settlement (80%)</h4>
                      <span className="bd-timeline-amount">{money(displayFinalAmount)}</span>
                    </div>
                    <p className="bd-timeline-status">
                      {isFinalPaid ? "Paid successfully" : "Awaiting final settlement"}
                    </p>
                  </div>
                </div>

                {/* Add-on Payments */}
                {booking.addOnPayments && booking.addOnPayments.filter(p => p.status === 'paid').map((addon, index) => (
                  <div className="bd-timeline-item" key={addon._id || index}>
                    <span className="bd-timeline-dot bd-dot-paid">
                      <FontAwesomeIcon icon={faCheckCircle} />
                    </span>
                    <div className="bd-timeline-content">
                      <div className="bd-timeline-row">
                        <h4 className="bd-timeline-title">Add-on Payment</h4>
                        <span className="bd-timeline-amount">{money(addon.amount)}</span>
                      </div>
                      <p className="bd-timeline-status">
                        Paid on {formatDate(addon.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACTION BUTTONS & SUCCESS STATUS */}
              {status === "cancelled" ? (
                <div className="bd-complete-box" style={{ backgroundColor: "#ffe4e6", borderColor: "#fda4af" }}>
                  <p className="bd-complete-text" style={{ color: "#e11d48" }}>
                    <FontAwesomeIcon icon={faTimesCircle} className="bd-complete-icon" style={{ color: "#e11d48" }} />
                    This booking was cancelled — no further payment is required.
                  </p>
                </div>
              ) : paymentStatus === "fully_paid" ? (
                <div className="bd-complete-box">
                  <p className="bd-complete-text">
                    <FontAwesomeIcon icon={faCheckCircle} className="bd-complete-icon" />
                    Payment Complete
                  </p>
                </div>
              ) : (
                <div className="bd-pay-action">
                  {paymentStatus === "deposit_pending" || paymentStatus === "pending" ? (
                    <Link
                      to={`/dashboard/payment?bookingId=${booking._id}`}
                      className="bd-pay-btn"
                    >
                      <FontAwesomeIcon icon={faCreditCard} />
                      Proceed to Pay Deposit
                    </Link>
                  ) : booking.finalBillExists ? (
                    <Link
                      to={`/dashboard/payment?bookingId=${booking._id}`}
                      className="bd-pay-btn"
                    >
                      <FontAwesomeIcon icon={faCreditCard} />
                      Proceed to Pay Final Balance
                    </Link>
                  ) : (
                    <div className="bd-complete-box" style={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1", width: "100%" }}>
                      <p className="bd-complete-text" style={{ color: "#475569" }}>
                        <FontAwesomeIcon icon={faClock} className="bd-complete-icon" style={{ color: "#64748b" }} />
                        Final bill not generated yet. You will be able to complete the final payment once your guide generates the invoice.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {isModalOpen && (
          <div className="addon-modal-overlay">
            <div className="addon-modal-container">
              <div className="addon-modal-header">
                <h2 className="addon-modal-title">Add Extra Rentals & Gear</h2>
                <button
                  type="button"
                  className="addon-modal-close-btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedAssets({});
                  }}
                >
                  ✖
                </button>
              </div>

              <div className="addon-modal-body">
                {estimateError && (
                  <div className="payment-error" style={{ marginBottom: "16px", borderRadius: "12px" }}>
                    {estimateError}
                  </div>
                )}
                <AssetSelector
                  assets={availableAssets}
                  selectedAssets={selectedAssets}
                  onAdd={handleAddAsset}
                  onRemove={handleRemoveAsset}
                  onQuantityChange={handleQuantityChange}
                />
              </div>

              <div className="addon-modal-footer">
                <div className="addon-modal-info">
                  {Object.values(selectedAssets).length > 0 ? (
                    <>
                      <p className="addon-modal-selection-text">
                        Adding: {Object.values(selectedAssets).map(item => `${item.name} x${item.quantity}`).join(', ')}
                      </p>
                      <p className="addon-modal-total-text">
                        Additional cost: <span>₹{Number(additionalCost).toLocaleString("en-IN")}</span>
                      </p>
                    </>
                  ) : (
                    <p className="addon-modal-selection-text">No items selected yet.</p>
                  )}
                </div>
                <div className="addon-modal-actions">
                  <button
                    type="button"
                    className="addon-modal-cancel-btn"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedAssets({});
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="addon-modal-submit-btn"
                    disabled={Object.values(selectedAssets).length === 0 || processingAddon}
                    onClick={handleConfirmAddon}
                  >
                    {processingAddon ? "Processing..." : "Confirm & Pay"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookingDetail;
