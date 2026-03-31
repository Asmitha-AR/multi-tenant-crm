from contextlib import contextmanager
from threading import local


_tenant_state = local()


def get_current_organization():
    return getattr(_tenant_state, "organization", None)


def set_current_organization(organization):
    _tenant_state.organization = organization


def clear_current_organization():
    if hasattr(_tenant_state, "organization"):
        delattr(_tenant_state, "organization")


@contextmanager
def tenant_context(organization):
    previous = get_current_organization()
    set_current_organization(organization)
    try:
        yield
    finally:
        if previous is None:
            clear_current_organization()
        else:
            set_current_organization(previous)

