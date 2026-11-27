<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store each complex-building manual estimate image in the private `aerials/estimates/<request-id>/` path and its path in `quote_requests.aerial_url`, because the saved estimate and PDF must reopen with the same approved drawing.
- Keep estimate contractual terms in the existing admin-editable `site_settings` record and render them through a separate print-page component after the estimate, so legal wording stays centrally editable and readable without crowding the drawing and signature.
- Share uploaded brand asset pointers between site and estimate headers, with surface-appropriate lettering and width-constrained images, so wide wordmarks remain legible without changing print pagination.
