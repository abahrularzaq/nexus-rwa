"use client";

import { useCallback, useMemo } from "react";
import { isAddress, parseEther } from "viem";
import { base, baseSepolia } from "viem/chains";
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

import type { X402Details } from "@/types/x402";

export type PaymentStatus =
  | "idle"
  | "confirming"
  | "mining"
  | "success"
  | "error";

function targetChainIdForNetwork(network: string): number {
  const n = network.toLowerCase();
  if (n === "base" || n === "base-mainnet") return base.id;
  if (
    n === "base-sepolia" ||
    n === "basesepolia" ||
    n === "base_sepolia"
  ) {
    return baseSepolia.id;
  }
  return base.id;
}

export function useX402Payment() {
  const {
    sendTransaction,
    data: txHash,
    isPending: sendPending,
    isError: sendError,
    error: sendErr,
    reset,
  } = useSendTransaction();

  const {
    isSuccess: receiptSuccess,
    isError: receiptError,
    error: receiptErr,
    isFetching: receiptFetching,
    isPending: receiptPending,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  const awaitingReceipt =
    Boolean(txHash) && !receiptSuccess && !receiptError;

  const paymentStatus: PaymentStatus = useMemo(() => {
    if (receiptError || (sendError && !txHash)) return "error";
    if (receiptSuccess && txHash) return "success";
    if (awaitingReceipt) return "mining";
    if (sendPending) return "confirming";
    return "idle";
  }, [
    awaitingReceipt,
    receiptError,
    receiptSuccess,
    sendError,
    sendPending,
    txHash,
  ]);

  const isConfirming = sendPending;
  const isPaying =
    sendPending || (Boolean(txHash) && (receiptFetching || receiptPending));

  const error = sendErr ?? receiptErr ?? null;

  const initiatePayment = useCallback(
    (x402: X402Details) => {
      if (!isAddress(x402.recipient)) return;
      const chainId = targetChainIdForNetwork(x402.network);
      sendTransaction({
        chainId,
        to: x402.recipient,
        value: parseEther(x402.price),
      });
    },
    [sendTransaction],
  );

  const resetPayment = useCallback(() => {
    reset();
  }, [reset]);

  return {
    isPaying,
    isConfirming,
    txHash: txHash ?? null,
    error,
    initiatePayment,
    paymentStatus,
    resetPayment,
  };
}
