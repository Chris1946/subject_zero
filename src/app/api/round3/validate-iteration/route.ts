import { NextRequest, NextResponse } from "next/server";

const DATA = [4, 7, 2, 9, 5, 8, 3];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { iterationIndex, i, dataVal, op, result } = body;

    if (
      typeof iterationIndex !== "number" ||
      iterationIndex < 0 ||
      iterationIndex >= DATA.length
    ) {
      return NextResponse.json(
        { valid: false, error: "INVALID_ITERATION_INDEX" },
        { status: 400 }
      );
    }

    // Step-by-step authoritative Python execution simulation
    let currentResult = 0;
    let expectedI = 0;
    let expectedDataVal = 0;
    let expectedOp: "+" | "-" = "+";

    for (let step = 0; step <= iterationIndex; step++) {
      expectedI = step;
      expectedDataVal = DATA[step];
      expectedOp = step % 2 === 0 ? "+" : "-";

      if (expectedOp === "+") {
        currentResult += expectedDataVal;
      } else {
        currentResult -= expectedDataVal;
      }
    }

    // Validate inputs
    const numI = Number(i);
    const numDataVal = Number(dataVal);
    const numResult = Number(result);
    const cleanOp = (op || "").trim();

    const isIValid = numI === expectedI;
    const isDataValid = numDataVal === expectedDataVal;
    const isOpValid = cleanOp === expectedOp || (expectedOp === "-" && cleanOp === "−");
    const isResultValid = numResult === currentResult;

    if (isIValid && isDataValid && isOpValid && isResultValid) {
      const isComplete = iterationIndex === DATA.length - 1;
      return NextResponse.json({
        valid: true,
        iterationIndex,
        isComplete,
        finalOutput: isComplete ? currentResult : undefined,
      });
    }

    // Construct specific feedback without revealing the answer
    let reason = "EXECUTION MISMATCH: ";
    if (!isIValid) {
      reason += "CHECK LOOP INDEX (i). ";
    } else if (!isDataValid) {
      reason += "CHECK LIST VALUE data[i]. ";
    } else if (!isOpValid) {
      reason += "CHECK BRANCH CONDITION (i % 2 == 0). ";
    } else if (!isResultValid) {
      reason += "INCORRECT RESULT ARITHMETIC. ";
    }

    return NextResponse.json({
      valid: false,
      error: reason.trim(),
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: "VALIDATION_TRANSMISSION_ERROR" },
      { status: 500 }
    );
  }
}
