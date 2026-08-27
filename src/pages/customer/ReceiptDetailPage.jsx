// src/pages/patient/ReceiptDetailPage.jsx

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    CreditCard,
    MapPin,
    Phone,
    Printer,
    UserRound,
} from 'lucide-react';

import PatientLayout from '@/components/layout/CustomerLayout';
import { useReceiptDetail } from '@/hooks/usePaymentHistory';
import { ROUTES } from '@/constants/routes';

/* =========================================================
   HELPERS
========================================================= */

const fmt = (value) =>
    value != null
        ? new Intl.NumberFormat('vi-VN').format(
            Number(value)
        )
        : '—';

const fmtVND = (value) =>
    value != null
        ? `${new Intl.NumberFormat('vi-VN').format(
            Number(value)
        )} đ`
        : '—';

const empty = (value) =>
    value != null &&
    String(value).trim() !== ''
        ? value
        : '—';

/* =========================================================
   MAIN
========================================================= */

export default function ReceiptDetailPage() {
    const { id } = useParams();

    const navigate = useNavigate();

    const { t } =
        useTranslation('payment');

    const {
        receipt,
        loading,
        error,
        fetchReceipt,
    } = useReceiptDetail(id);

    /* =====================================================
       LOAD
    ===================================================== */

    useEffect(() => {
        fetchReceipt();
    }, [id]);

    /* =====================================================
       PRINT
    ===================================================== */

    const handlePrint = () => {
        window.print();
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <PatientLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <p className="text-sm text-gray-400">
                        {t(
                            'paymentHistory.loading'
                        )}
                    </p>
                </div>
            </PatientLayout>
        );
    }

    /* =====================================================
       DATA
    ===================================================== */

    const items =
        receipt?.items ?? [];

    const totalSvc =
        Number(
            receipt?.totalService ??
            0
        );

    const bhytCover =
        Number(
            receipt?.bhytCoverage ??
            0
        );

    const patientPay =
        receipt?.patientPayment !=
        null
            ? Number(
                receipt.patientPayment
            )
            : totalSvc -
            bhytCover;

    const receiptCode =
        receipt?.receiptCode ||
        receipt?.code ||
        receipt?.invoiceCode ||
        `PT-${String(id || '').slice(
            0,
            8
        )}`;

    const paymentMethod =
        receipt?.paymentMethod ||
        receipt?.method ||
        '—';

    const cashierName =
        receipt?.cashierName ||
        receipt?.cashier ||
        '—';

    const patientPhone =
        receipt?.patientPhone ||
        receipt?.phone ||
        '';

    const patientAddress =
        receipt?.patientAddress ||
        receipt?.address ||
        '';

    const insuranceCode =
        receipt?.insuranceCode ||
        receipt?.bhytCode ||
        '';

    const initialHospital =
        receipt?.initialHospital ||
        receipt?.insuranceHospital ||
        '';

    /* =====================================================
       UI
    ===================================================== */

    return (
        <PatientLayout>
            <div className="w-full space-y-5 print:space-y-0">

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div className="print:hidden">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                ROUTES.CUSTOMER_PAYMENT
                            )
                        }
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                    >
                        <ArrowLeft size={16} />

                        Quay lại lịch sử thanh toán
                    </button>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Chi tiết phiếu thu
                            </h1>

                            <p className="mt-1 text-sm text-gray-400">
                                Thông tin chi tiết giao dịch và các dịch vụ đã thanh toán
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                handlePrint
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-700"
                        >
                            <Printer
                                size={16}
                            />

                            In phiếu thu
                        </button>
                    </div>
                </div>

                {/* =================================================
                    RECEIPT
                ================================================= */}

                <div
                    id="receipt-paper"
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white print:rounded-none print:border-0"
                >

                    {/* =================================================
                        RECEIPT HEADER
                    ================================================= */}

                    <div className="grid grid-cols-1 gap-6 border-b border-gray-100 px-6 py-6 lg:grid-cols-[1fr_1fr] lg:px-8">

                        {/* CLINIC */}

                        <div>
                            <p className="text-base font-bold text-gray-900">
                                {t(
                                    'receiptDetail.clinicName'
                                )}
                            </p>

                            <div className="mt-2 space-y-1.5">

                                <p className="flex items-center gap-2 text-xs text-gray-500">
                                    <MapPin
                                        size={14}
                                        className="shrink-0 text-gray-400"
                                    />

                                    {t(
                                        'receiptDetail.clinicAddress'
                                    )}
                                </p>

                                <p className="flex items-center gap-2 text-xs text-gray-500">
                                    <Phone
                                        size={14}
                                        className="shrink-0 text-gray-400"
                                    />

                                    {t(
                                        'receiptDetail.clinicHotline'
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* RECEIPT CODE */}

                        <div className="lg:text-right">

                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Phiếu thu
                            </p>

                            <p className="mt-1 text-xl font-bold text-gray-900">
                                {receiptCode}
                            </p>

                            <p className="mt-2 text-xs text-gray-500">
                                Ngày lập phiếu:{' '}
                                <span className="font-medium text-gray-700">
                                    {empty(
                                        receipt?.issuedDate
                                    )}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* =================================================
                        RECEIPT META
                    ================================================= */}

                    {/* =================================================
    PATIENT + STATUS
================================================= */}

                    <section className="border-b border-gray-100 px-6 py-6 lg:px-8">

                        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

                            {/* PATIENT */}

                            <div className="min-w-0">

                                <div className="mb-4 flex items-center gap-2">
                                    <UserRound
                                        size={17}
                                        className="text-gray-500"
                                    />

                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Thông tin bệnh nhân
                                    </p>
                                </div>

                                <p className="text-lg font-bold text-gray-900">
                                    {empty(
                                        receipt?.patientName
                                    )}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Mã bệnh nhân:{' '}
                                    <span className="font-medium text-gray-700">
                    {empty(
                        receipt?.patientId
                    )}
                </span>
                                </p>

                                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">

                <span className="inline-flex items-center gap-2">
                    <CalendarDays
                        size={15}
                        className="text-gray-400"
                    />

                    {empty(
                        receipt?.dob
                    )}
                </span>

                                    <span>
                    {empty(
                        receipt?.gender
                    )}
                </span>

                                    {patientPhone && (
                                        <span className="inline-flex items-center gap-2">
                        <Phone
                            size={15}
                            className="text-gray-400"
                        />

                                            {patientPhone}
                    </span>
                                    )}
                                </div>

                                {patientAddress && (
                                    <p className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                                        <MapPin
                                            size={15}
                                            className="mt-0.5 shrink-0 text-gray-400"
                                        />

                                        {patientAddress}
                                    </p>
                                )}
                            </div>

                            {/* STATUS */}

                            <div className="shrink-0 lg:pt-1">

            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-600">

                <CheckCircle2
                    size={14}
                />

                {t(
                    'receiptDetail.statusPaid'
                )}
            </span>
                            </div>
                        </div>
                    </section>

                    {/* =================================================
                        SERVICE + SUMMARY
                    ================================================= */}

                    {/* =================================================
    SERVICE + SUMMARY
================================================= */}

                    <div className="p-6 lg:px-8 lg:py-6">

                        {/* =================================================
        SERVICE TABLE
    ================================================= */}

                        <section>
                            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-900">
                                Chi tiết dịch vụ
                            </h2>

                            <div className="overflow-hidden rounded-xl border border-gray-200">

                                <table className="w-full table-fixed">

                                    <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">

                                        <th className="w-[70px] px-4 py-3 text-left text-xs font-medium text-gray-400">
                                            STT
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                                            Dịch vụ
                                        </th>

                                        <th className="w-[80px] px-4 py-3 text-center text-xs font-medium text-gray-400">
                                            SL
                                        </th>

                                        <th className="w-[150px] px-4 py-3 text-right text-xs font-medium text-gray-400">
                                            Đơn giá
                                        </th>

                                        <th className="w-[160px] px-4 py-3 text-right text-xs font-medium text-gray-400">
                                            Thành tiền
                                        </th>

                                        <th className="w-[130px] px-4 py-3 text-right text-xs font-medium text-gray-400">
                                            BHYT giảm
                                        </th>
                                    </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">

                                    {items.map((item, index) => {
                                        const qty =
                                            Number(
                                                item.qty ?? 1
                                            );

                                        const unitPrice =
                                            Number(
                                                item.unitPrice ?? 0
                                            );

                                        const subtotal =
                                            qty * unitPrice;

                                        const bhytRate =
                                            Number(
                                                item.bhytRate ?? 0
                                            );

                                        const bhytAmount =
                                            item.bhytAmount != null
                                                ? Number(
                                                    item.bhytAmount
                                                )
                                                : Math.round(
                                                    subtotal *
                                                    (bhytRate /
                                                        100)
                                                );

                                        return (
                                            <tr
                                                key={
                                                    item.id ??
                                                    index
                                                }
                                                className="hover:bg-gray-50/70"
                                            >
                                                <td className="px-4 py-4 text-xs text-gray-400">
                                                    {String(
                                                        index + 1
                                                    ).padStart(
                                                        2,
                                                        '0'
                                                    )}
                                                </td>

                                                <td className="px-4 py-4">

                                                    <p className="truncate text-sm font-semibold text-gray-900">
                                                        {empty(
                                                            item.name
                                                        )}
                                                    </p>

                                                    {item.category && (
                                                        <p className="mt-0.5 truncate text-xs text-gray-400">
                                                            {
                                                                item.category
                                                            }
                                                        </p>
                                                    )}

                                                    {bhytRate >
                                                        0 && (
                                                            <p className="mt-1 text-[11px] text-gray-400">
                                                                BHYT{' '}
                                                                {
                                                                    bhytRate
                                                                }
                                                                %
                                                            </p>
                                                        )}
                                                </td>

                                                <td className="px-4 py-4 text-center text-sm text-gray-600">
                                                    {qty}
                                                </td>

                                                <td className="px-4 py-4 text-right text-sm text-gray-600 tabular-nums">
                                                    {fmtVND(
                                                        unitPrice
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900 tabular-nums">
                                                    {fmtVND(
                                                        subtotal
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-right text-sm text-gray-500 tabular-nums">
                                                    {fmtVND(
                                                        bhytAmount
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {items.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-12 text-center text-sm text-gray-400"
                                            >
                                                Không có dịch vụ thanh toán.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* =================================================
        SUMMARY
    ================================================= */}

                        <div className="mt-6 flex justify-end">

                            <div className="w-full max-w-[420px]">

                                <div className="space-y-3">

                                    <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                        Tổng tiền dịch vụ
                    </span>

                                        <span className="font-semibold text-gray-900 tabular-nums">
                        {fmtVND(
                            totalSvc
                        )}
                    </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                        BHYT chi trả
                    </span>

                                        <span
                                            className={`font-semibold tabular-nums ${
                                                bhytCover > 0
                                                    ? 'text-green-600'
                                                    : 'text-gray-700'
                                            }`}
                                        >
                        {bhytCover > 0
                            ? `- ${fmtVND(
                                bhytCover
                            )}`
                            : fmtVND(0)}
                    </span>
                                    </div>
                                </div>

                                <div className="my-4 border-t border-gray-200" />

                                <div className="flex items-end justify-between gap-6">

                                    <div>
                                        <p className="text-sm font-bold uppercase tracking-wide text-gray-800">
                                            Bệnh nhân trả
                                        </p>

                                        {receipt?.inWords && (
                                            <p className="mt-1 max-w-[220px] text-xs leading-5 text-gray-400">
                                                (
                                                {t(
                                                    'receiptDetail.inWords'
                                                )}{' '}
                                                {
                                                    receipt.inWords
                                                }
                                                )
                                            </p>
                                        )}
                                    </div>

                                    <p className="whitespace-nowrap text-2xl font-bold text-gray-900 tabular-nums">
                                        {fmtVND(
                                            patientPay
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* =================================================
        THANK YOU
    ================================================= */}

                        <div className="mt-7 border-t border-gray-100 pt-5 text-center">

                            <p className="text-sm font-semibold text-gray-800">
                                Cảm ơn quý khách!
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                Chúc quý khách sức khỏe.
                            </p>
                        </div>
                    </div>

                    {/* =================================================
                        FOOTER NOTE
                    ================================================= */}

                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 lg:px-8">

                        <p className="text-center text-xs text-gray-400">
                            Phiếu thu được lưu trữ điện tử trong hệ thống CareS.
                        </p>
                    </div>
                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 print:hidden">

                        <p className="text-sm text-red-500">
                            {error}
                        </p>
                    </div>
                )}

                {/* =================================================
                    PRINT STYLE
                ================================================= */}

                <style>
                    {`
                        @media print {
                            @page { size: A4 portrait; margin: 10mm; }
                            body {
                                background: white !important;
                            }

                            body * { visibility: hidden !important; }

                            #receipt-paper, #receipt-paper * { visibility: visible !important; }

                            #receipt-paper {
                                position: absolute !important;
                                inset: 0 !important;
                                width: 100% !important;
                                max-width: none !important;
                                margin: 0 !important;
                                box-shadow: none !important;
                            }

                            #receipt-paper table {
                                font-size: 11px;
                            }

                        }
                    `}
                </style>
            </div>
        </PatientLayout>
    );
}
