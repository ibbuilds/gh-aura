/** Stable diagnostics without raw exception text, private paths or credentials. */
export function agentError(error,operation){
  const message=String(error?.message||'');
  let code='OPERATION_FAILED',next='Check inputs and local diagnostics using gh-aura agent doctor.';
  if(error?.status===401){code='AUTHENTICATION_REQUIRED';next='Configure a valid credential locally; never send tokens through tool arguments.';}
  else if(error?.status===403){code='ACCESS_DENIED';next='Check the selected account, repository permissions, rules and rate limits locally.';}
  else if(error?.status===429||/rate limit|write budget|quota/i.test(message)){code='RATE_LIMITED';next='Wait for the provider or local quota reset, inspect status, then resume the same reviewed plan.';}
  else if(error?.code==='GH_AURA_BUDGET'){code='READ_BUDGET_EXCEEDED';next='Reduce inspection or continue the project scan using its next cursor.';}
  else if(error?.code==='PROFILE_LOCKED'){code='EXECUTION_LOCKED';next='Check local status and the recorded process; do not start another writer.';}
  else if(/unknown|uncertain/i.test(message)){code='OUTCOME_UNKNOWN';next='Inspect local status and actual GitHub state before resuming. Do not create a replacement write.';}
  else if(/fingerprint|changed|stale|appeared after planning/i.test(message)){code='STALE_PLAN';next='Inspect current state, prepare a new plan and obtain a new owner authorization.';}
  else if(/invalid|expected|required|supply|unexpected|missing|unknown.*arguments/i.test(message)){code='INVALID_INPUT_OR_SETUP';next='Check the tool schema and local setup. The owner supplies missing configuration outside the model.';}
  return {format:'gh-aura-agent-error-v1',code,operation,next,
    effects:operation==='gh_aura_apply_approved_profile'?'Some reviewed steps may have completed; inspect status.':'No remote mutation is provided by this read-only tool.'};
}
